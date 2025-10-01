# EXTREMAMENTE MINIMALISTA - APENAS FFmpeg + FastAPI
FROM python:3.10-slim

# Build version: 2024-10-01-v17-CORS-FIX
# Instalar apenas FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Instalar apenas dependências absolutamente essenciais
COPY backend/requirements.minimal-extreme.txt .
RUN pip install --no-cache-dir -r requirements.minimal-extreme.txt \
    && pip cache purge \
    && rm -rf /root/.cache

# Copiar código
COPY backend/ .

# Criar diretórios
RUN mkdir -p uploads outputs

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
