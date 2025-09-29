"""
Gerenciador de arquivos para upload e organização
"""

from pathlib import Path
import aiofiles
import uuid
from fastapi import UploadFile
import os

class FileManager:
    def __init__(self):
        self.upload_dir = Path("uploads")
        self.output_dir = Path("outputs")
        
        # Criar diretórios se não existirem
        self.upload_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
    
    async def save_upload(self, file: UploadFile, job_id: str) -> Path:
        """Salvar arquivo de upload"""
        # Criar diretório para o job
        job_dir = self.upload_dir / job_id
        job_dir.mkdir(exist_ok=True)
        
        # Caminho do arquivo
        file_path = job_dir / file.filename
        
        # Salvar arquivo
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return file_path
    
    def get_output_dir(self, job_id: str) -> Path:
        """Obter diretório de saída para um job"""
        output_dir = self.output_dir / job_id
        output_dir.mkdir(exist_ok=True)
        return output_dir
    
    def cleanup_job(self, job_id: str):
        """Limpar arquivos de um job (opcional)"""
        import shutil
        
        # Limpar uploads
        upload_path = self.upload_dir / job_id
        if upload_path.exists():
            shutil.rmtree(upload_path)
        
        # Limpar outputs (manter por mais tempo)
        # output_path = self.output_dir / job_id
        # if output_path.exists():
        #     shutil.rmtree(output_path)
