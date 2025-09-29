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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
