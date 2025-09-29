"""
Sistema de tracking de progresso para jobs
"""

import json
import time
from typing import Dict, Optional
from pathlib import Path
from core.models import ProcessingProgress, ProcessingStatus

class ProgressTracker:
    def __init__(self):
        self.progress_file = Path("temp/progress.json")
        self.progress_file.parent.mkdir(exist_ok=True)
        
        # Carregar progresso existente
        self.jobs = self._load_progress()
    
    def _load_progress(self) -> Dict:
        """Carregar progresso do arquivo"""
        if self.progress_file.exists():
            try:
                with open(self.progress_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def _save_progress(self):
        """Salvar progresso no arquivo"""
        try:
            with open(self.progress_file, 'w') as f:
                json.dump(self.jobs, f, indent=2)
        except Exception as e:
            print(f"Erro ao salvar progresso: {e}")
    
    def create_job(self, job_id: str, filename: str) -> ProcessingProgress:
        """Criar novo job"""
        progress = ProcessingProgress(
            job_id=job_id,
            status=ProcessingStatus.UPLOADED,
            progress=0,
            stage="Arquivo carregado",
            created_at=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        self.jobs[job_id] = progress.dict()
        self._save_progress()
        return progress
    
    def update_job(
        self, 
        job_id: str, 
        status: Optional[ProcessingStatus] = None,
        progress: Optional[int] = None,
        stage: Optional[str] = None,
        error: Optional[str] = None
    ):
        """Atualizar job existente"""
        if job_id not in self.jobs:
            return
        
        job = self.jobs[job_id]
        
        if status:
            job["status"] = status.value
        if progress is not None:
            job["progress"] = progress
        if stage:
            job["stage"] = stage
        if error:
            job["error"] = error
            job["status"] = ProcessingStatus.ERROR.value
        
        if status == ProcessingStatus.COMPLETED:
            job["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
        
        self._save_progress()
    
    def add_clips(self, job_id: str, clips: list):
        """Adicionar clips ao job"""
        if job_id in self.jobs:
            self.jobs[job_id]["clips"] = clips
            self._save_progress()
    
    def get_job(self, job_id: str) -> Optional[Dict]:
        """Obter job por ID"""
        return self.jobs.get(job_id)
    
    def get_all_jobs(self) -> Dict:
        """Obter todos os jobs"""
        return self.jobs
    
    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """Limpar jobs antigos"""
        current_time = time.time()
        to_remove = []
        
        for job_id, job in self.jobs.items():
            created_at = job.get("created_at")
            if created_at:
                try:
                    job_time = time.mktime(time.strptime(created_at, "%Y-%m-%d %H:%M:%S"))
                    if (current_time - job_time) > (max_age_hours * 3600):
                        to_remove.append(job_id)
                except:
                    pass
        
        for job_id in to_remove:
            del self.jobs[job_id]
        
        if to_remove:
            self._save_progress()
