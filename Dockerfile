FROM python:3.10-slim

# Build version: 2024-10-01-v5-MINIMAL
# Instalar dependências do sistema (apenas essenciais)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar requirements do backend e instalar dependências Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Baixar modelo spaCy
RUN python -m spacy download pt_core_news_sm

# Copiar código do backend
COPY backend/ .

# Criar diretórios necessários
RUN mkdir -p uploads outputs temp models

# Expor porta
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
