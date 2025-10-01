"""
VCUT Pro - Sistema Profissional de Cortes Inteligentes
Pipeline completo inspirado em OpusClip/Wisecut
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import uuid
from pathlib import Path
from typing import Dict
import asyncio

from core.video_processor import VideoProcessor
from utils.file_manager import FileManager

app = FastAPI(title="VCUT Pro API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instâncias globais
video_processor = VideoProcessor()
file_manager = FileManager()
processing_jobs: Dict[str, Dict] = {}

@app.post("/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    file_path = await file_manager.save_upload(file, job_id)
    
    processing_jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "stage": "Iniciando...",
        "clips": []
    }
    
    background_tasks.add_task(process_video_pipeline, job_id, file_path)
    return {"job_id": job_id, "message": "Processamento iniciado"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return processing_jobs[job_id]

@app.get("/download/{job_id}/{clip_id}")
async def download_clip(job_id: str, clip_id: str):
    job = processing_jobs[job_id]
    clip = next((c for c in job["clips"] if c["id"] == clip_id), None)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip não encontrado")
    
    return FileResponse(clip["file_path"], filename=clip["filename"])

@app.post("/manual-cut")
async def manual_cut(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    start_time: str = "00:00",
    end_time: str = "00:30",
    title: str = "Corte_Manual"
):
    """Corte manual rápido sem IA - apenas FFmpeg otimizado"""
    job_id = str(uuid.uuid4())
    file_path = await file_manager.save_upload(file, job_id)
    
    processing_jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "stage": "Processando corte...",
        "clips": []
    }
    
    background_tasks.add_task(process_manual_cut, job_id, file_path, start_time, end_time, title)
    return {"job_id": job_id, "message": "Corte manual iniciado"}

async def process_video_pipeline(job_id: str, file_path: Path):
    try:
        job = processing_jobs[job_id]
        
        # Pipeline completo
        job["stage"] = "Transcrevendo..."
        job["progress"] = 20
        transcription = await video_processor.transcribe_audio(file_path)
        
        job["stage"] = "Analisando conteúdo..."
        job["progress"] = 40
        analysis = await video_processor.analyze_content(transcription)
        
        job["stage"] = "Detectando cenas..."
        job["progress"] = 60
        scenes = await video_processor.detect_scenes(file_path)
        
        job["stage"] = "Gerando cortes..."
        job["progress"] = 80
        clips = await video_processor.generate_intelligent_clips(
            file_path, transcription, analysis, scenes
        )
        
        job["clips"] = clips
        job["status"] = "completed"
        job["progress"] = 100
        job["stage"] = "Concluído!"
        
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)

async def process_manual_cut(job_id: str, file_path: Path, start_time: str, end_time: str, title: str):
    """Processamento rápido de corte manual"""
    try:
        job = processing_jobs[job_id]
        
        # Converter tempo MM:SS para segundos
        def time_to_seconds(time_str):
            parts = time_str.split(':')
            return int(parts[0]) * 60 + int(parts[1])
        
        start_seconds = time_to_seconds(start_time)
        end_seconds = time_to_seconds(end_time)
        
        job["stage"] = "Cortando vídeo..."
        job["progress"] = 50
        
        # Criar clip com FFmpeg otimizado
        output_path = file_path.parent / f"{title}_WhatsApp.mp4"
        
        await video_processor._create_vertical_clip(
            file_path, 
            output_path, 
            start_seconds, 
            end_seconds,
            title
        )
        
        # Adicionar clip ao job
        clip = {
            "id": "manual_clip",
            "filename": f"{title}_WhatsApp.mp4",
            "file_path": str(output_path),
            "start_time": start_seconds,
            "end_time": end_seconds,
            "duration": end_seconds - start_seconds,
            "description": f"Corte manual: {start_time} - {end_time}"
        }
        
        job["clips"] = [clip]
        job["status"] = "completed"
        job["progress"] = 100
        job["stage"] = "Concluído!"
        
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
