@echo off
echo 🚀 Iniciando VCUT Pro Backend...
echo ================================

:: Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado! Instale Python 3.8+
    pause
    exit /b 1
)

:: Verificar se FFmpeg está instalado
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo ❌ FFmpeg não encontrado!
    echo 📥 Baixe em: https://ffmpeg.org/download.html
    pause
    exit /b 1
)

:: Criar ambiente virtual se não existir
if not exist "venv" (
    echo 📦 Criando ambiente virtual...
    python -m venv venv
)

:: Ativar ambiente virtual
echo 🔧 Ativando ambiente virtual...
call venv\Scripts\activate

:: Instalar dependências
echo 📚 Instalando dependências...
pip install -r requirements.txt

:: Baixar modelos
echo 🤖 Configurando modelos de IA...
python -m spacy download pt_core_news_sm

:: Criar diretórios
echo 📁 Criando diretórios...
if not exist "uploads" mkdir uploads
if not exist "outputs" mkdir outputs
if not exist "temp" mkdir temp
if not exist "models" mkdir models

:: Iniciar servidor
echo ================================
echo ✅ Iniciando servidor VCUT Pro...
echo 🌐 API: http://localhost:8000
echo 📖 Docs: http://localhost:8000/docs
echo ================================

python main.py

pause
