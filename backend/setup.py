"""
Script de setup para instalar dependências e configurar o ambiente
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Instalar dependências do requirements.txt"""
    print("📦 Instalando dependências Python...")
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
    ])

def download_models():
    """Baixar modelos necessários"""
    print("🤖 Baixando modelos de IA...")
    
    # Modelo spaCy português
    try:
        subprocess.check_call([
            sys.executable, "-m", "spacy", "download", "pt_core_news_sm"
        ])
    except:
        print("⚠️  Modelo spaCy já instalado ou erro no download")

def setup_directories():
    """Criar diretórios necessários"""
    print("📁 Criando diretórios...")
    
    dirs = ["uploads", "outputs", "temp", "models"]
    for dir_name in dirs:
        Path(dir_name).mkdir(exist_ok=True)
        print(f"✅ Diretório {dir_name} criado")

def check_ffmpeg():
    """Verificar se FFmpeg está instalado"""
    print("🎬 Verificando FFmpeg...")
    
    try:
        subprocess.run(["ffmpeg", "-version"], 
                      capture_output=True, check=True)
        print("✅ FFmpeg encontrado")
    except:
        print("❌ FFmpeg não encontrado!")
        print("📥 Instale FFmpeg:")
        print("   Windows: https://ffmpeg.org/download.html")
        print("   Linux: sudo apt install ffmpeg")
        print("   Mac: brew install ffmpeg")

def main():
    print("🚀 Configurando VCUT Pro Backend...")
    print("=" * 50)
    
    # Verificar Python
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ necessário")
        sys.exit(1)
    
    print(f"✅ Python {sys.version}")
    
    # Setup
    setup_directories()
    check_ffmpeg()
    install_requirements()
    download_models()
    
    print("=" * 50)
    print("✅ Setup concluído!")
    print("🚀 Para iniciar o servidor:")
    print("   python main.py")
    print("🌐 API estará em: http://localhost:8000")

if __name__ == "__main__":
    main()
