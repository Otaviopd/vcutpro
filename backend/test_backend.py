"""
Teste rápido do backend
"""

import sys
import subprocess

def test_python():
    print("🐍 Testando Python...")
    print(f"Versão: {sys.version}")
    return True

def test_imports():
    print("📦 Testando imports...")
    try:
        import fastapi
        print(f"✅ FastAPI: {fastapi.__version__}")
        
        import whisper
        print("✅ Whisper: OK")
        
        import cv2
        print(f"✅ OpenCV: {cv2.__version__}")
        
        return True
    except ImportError as e:
        print(f"❌ Erro: {e}")
        return False

def test_ffmpeg():
    print("🎬 Testando FFmpeg...")
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ FFmpeg: OK")
            return True
        else:
            print("❌ FFmpeg não encontrado")
            return False
    except:
        print("❌ FFmpeg não encontrado")
        return False

def main():
    print("🚀 Testando VCUT Pro Backend...")
    print("=" * 40)
    
    tests = [
        test_python(),
        test_imports(),
        test_ffmpeg()
    ]
    
    print("=" * 40)
    if all(tests):
        print("✅ Todos os testes passaram!")
        print("🚀 Backend pronto para usar!")
    else:
        print("❌ Alguns testes falharam")
        print("📥 Execute: pip install -r requirements.txt")

if __name__ == "__main__":
    main()
