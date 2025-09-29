"""
Configurações do sistema VCUT Pro
"""

import os
from pathlib import Path

class Config:
    # Diretórios
    BASE_DIR = Path(__file__).parent
    UPLOAD_DIR = BASE_DIR / "uploads"
    OUTPUT_DIR = BASE_DIR / "outputs"
    TEMP_DIR = BASE_DIR / "temp"
    MODELS_DIR = BASE_DIR / "models"
    
    # API
    API_HOST = "0.0.0.0"
    API_PORT = 8000
    
    # Processamento
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
    ALLOWED_FORMATS = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
    
    # Whisper
    WHISPER_MODEL = "base"  # tiny, base, small, medium, large
    
    # Clips
    MIN_CLIP_DURATION = 30  # segundos
    MAX_CLIP_DURATION = 90  # segundos
    TARGET_CLIPS_COUNT = 10
    
    # Vídeo
    OUTPUT_WIDTH = 1080
    OUTPUT_HEIGHT = 1920
    OUTPUT_FPS = 30
    
    # OpenAI (opcional)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # Redis (para produção)
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    @classmethod
    def setup_directories(cls):
        """Criar diretórios necessários"""
        for dir_path in [cls.UPLOAD_DIR, cls.OUTPUT_DIR, cls.TEMP_DIR, cls.MODELS_DIR]:
            dir_path.mkdir(exist_ok=True)
