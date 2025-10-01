# Multi-stage build para reduzir tamanho final
FROM python:3.10-slim as builder

# Instalar ferramentas de build apenas no stage builder
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências Python no builder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage final - apenas runtime
FROM python:3.10-slim

# Build version: 2024-10-01-v10-MULTISTAGE
# Instalar apenas FFmpeg (runtime)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Copiar dependências instaladas do builder
COPY --from=builder /root/.local /root/.local

# Baixar modelo spaCy diretamente
RUN pip install --no-cache-dir https://github.com/explosion/spacy-models/releases/download/pt_core_news_sm-3.7.0/pt_core_news_sm-3.7.0-py3-none-any.whl

# Copiar código
COPY backend/ .

# Criar diretórios
RUN mkdir -p uploads outputs temp models

# Configurar PATH para usar pacotes do usuário
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/root/.local/lib/python3.10/site-packages:$PYTHONPATH

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
