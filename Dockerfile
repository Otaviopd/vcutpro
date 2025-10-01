FROM python:3.10-slim

# Build version: 2024-10-01-v7-SPACY-FIX
# Instalar dependências do sistema + ferramentas de build
RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    cmake \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar requirements do backend e instalar dependências Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Baixar modelo spaCy (método alternativo)
RUN pip install https://github.com/explosion/spacy-models/releases/download/pt_core_news_sm-3.7.0/pt_core_news_sm-3.7.0-py3-none-any.whl

# Copiar código do backend
COPY backend/ .

# Criar diretórios necessários
RUN mkdir -p uploads outputs temp models

# Expor porta
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
