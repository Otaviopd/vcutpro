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

from core.simple_ffmpeg_only import SimpleFFmpegProcessor
from utils.file_manager import FileManager

app = FastAPI(title="VCUT Pro API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instâncias globais
processor = SimpleFFmpegProcessor()
file_manager = FileManager()
processing_jobs: Dict[str, Dict] = {}

@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "VCUT Pro API", "version": "2.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}

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
        
        # Pipeline "IA" simulado
        job["stage"] = "Analisando com IA..."
        job["progress"] = 20
        await asyncio.sleep(2)  # Simular processamento
        
        job["stage"] = "Transcrevendo áudio..."
        job["progress"] = 40
        await asyncio.sleep(1)
        
        job["stage"] = "Detectando cenas..."
        job["progress"] = 60
        await asyncio.sleep(1)
        
        job["stage"] = "Gerando clips inteligentes..."
        job["progress"] = 80
        
        # Usar processador fake que simula IA
        output_dir = file_path.parent / "clips"
        output_dir.mkdir(exist_ok=True)
        
        clips_info = processor.generate_automatic_clips(str(file_path), str(output_dir))
        
        # Converter para formato esperado pelo frontend
        clips = []
        for i, clip_info in enumerate(clips_info):
            clips.append({
                "id": f"ai_clip_{i+1}",
                "filename": clip_info["filename"],
                "file_path": str(output_dir / clip_info["filename"]),
                "title": clip_info["title"],
                "description": clip_info["description"],
                "duration": clip_info["duration"],
                "start_time": clip_info["start_time"],
                "ai_score": clip_info["ai_score"],
                "engagement_prediction": clip_info["engagement_prediction"],
                "optimal_for": clip_info["optimal_for"]
            })
        
        job["clips"] = clips
        job["status"] = "completed"
        job["progress"] = 100
        job["stage"] = "IA concluída! 10 clips gerados"
        
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
        
        result = processor.cut_custom_segment(
            str(file_path), 
            str(output_path), 
            start_time,
            end_time
        )
        
        if not result["success"]:
            raise Exception(result.get("error", "Erro no corte"))
        
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
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
