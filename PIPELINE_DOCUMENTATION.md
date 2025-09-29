# 🚀 VCUT Pro - Pipeline Profissional de Cortes Inteligentes

## 📋 Visão Geral

Sistema completo inspirado em **OpusClip**, **Wisecut** e **Munch**, mas totalmente **código aberto** e **customizável**.

## 🏗️ Arquitetura

```
Frontend (Next.js) ←→ Backend (FastAPI/Python) ←→ IA Models
     ↓                        ↓                      ↓
Interface Web          Processamento           Whisper + NLP
                      de Vídeo                + OpenCV
```

## 🔄 Pipeline Completo

### 1. **Upload e Validação**
- ✅ Formatos: MP4, MOV, AVI, WebM, MKV
- ✅ Validação de tamanho (até 500MB)
- ✅ Job ID único para tracking

### 2. **Análise Inicial**
```python
# Extração de metadados
duration, fps, resolution = analyze_video(file)
```

### 3. **Transcrição com Whisper**
```python
# Transcrição com timestamps precisos
result = whisper.transcribe(audio, word_timestamps=True)
```

### 4. **Análise NLP de Relevância**
```python
# Detectar frases de impacto
impact_score = analyze_sentiment() + detect_keywords() + check_questions()
```

### 5. **Detecção de Cenas**
```python
# OpenCV para mudanças visuais
scene_changes = detect_visual_changes(video, threshold=0.3)
```

### 6. **Análise de Áudio**
```python
# PyDub para pausas e silêncios
silences = detect_silence_patterns(audio)
```

### 7. **Geração de Cortes Inteligentes**
```python
# Combinar todas as análises
clips = generate_clips(transcription, scenes, silences, impact_phrases)
```

### 8. **Formatação Final**
```python
# FFmpeg: 9:16 vertical + legendas + zoom
ffmpeg_process(input, output, filters=[
    'scale=1080:1920',
    'crop=1080:1920', 
    'drawtext=legendas'
])
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **FastAPI**: API REST moderna
- **Whisper**: Transcrição de áudio
- **spaCy**: Processamento de linguagem natural
- **OpenCV**: Detecção de cenas
- **PyDub**: Análise de áudio
- **FFmpeg**: Processamento de vídeo

### Frontend
- **Next.js**: Interface web (mantida)
- **React**: Componentes interativos
- **TypeScript**: Tipagem forte

## 📊 Critérios de Relevância

### Frases de Impacto (Score)
- **Palavras-chave**: +10 pontos
- **Sentimento positivo**: +15 pontos
- **Perguntas retóricas**: +8 pontos
- **Números/estatísticas**: +5 pontos

### Cortes Inteligentes
- **Duração**: 30-90 segundos
- **Baseado em**: Relevância + Pausas + Cenas
- **Formato**: 9:16 vertical automático
- **Legendas**: Automáticas com estilo

## 🚀 Como Usar

### 1. Configurar Backend
```bash
cd backend
python setup.py  # Instala tudo automaticamente
python main.py   # Inicia servidor
```

### 2. Integrar Frontend
```typescript
import { useIntelligentProcessor } from './hooks/useIntelligentProcessor';

const processor = useIntelligentProcessor();
const jobId = await processor.processVideo(videoFile);
```

### 3. Monitorar Progresso
```typescript
const status = await processor.getStatus(jobId);
// { progress: 75, stage: "Gerando cortes...", clips: [...] }
```

## 📈 Vantagens vs Concorrentes

| Recurso | VCUT Pro | OpusClip | Wisecut |
|---------|----------|----------|---------|
| **Código Aberto** | ✅ | ❌ | ❌ |
| **Customizável** | ✅ | ❌ | ❌ |
| **Sem Limites** | ✅ | ❌ | ❌ |
| **IA Local** | ✅ | ❌ | ❌ |
| **Formato 9:16** | ✅ | ✅ | ✅ |
| **Legendas Auto** | ✅ | ✅ | ✅ |

## 🔧 Configurações Avançadas

### Ajustar Sensibilidade
```python
# config.py
SCENE_DETECTION_THRESHOLD = 0.3  # Mais baixo = mais cenas
IMPACT_SCORE_MIN = 20           # Pontuação mínima
CLIP_COUNT = 10                 # Número de clips
```

### Personalizar Critérios
```python
# Adicionar suas próprias palavras-chave
CUSTOM_IMPACT_WORDS = ["exclusivo", "revelação", "segredo"]
```

## 📦 Deploy

### Docker (Recomendado)
```bash
docker-compose up -d
```

### Manual
```bash
# Backend
cd backend && python main.py

# Frontend  
cd .. && npm run dev
```

## 🎯 Roadmap

- [ ] **Face Detection**: Zoom automático em rostos
- [ ] **Música de Fundo**: Adicionar trilhas automáticas  
- [ ] **Templates**: Estilos pré-definidos
- [ ] **Batch Processing**: Múltiplos vídeos
- [ ] **API Webhooks**: Notificações automáticas

## 💡 Customizações Possíveis

1. **Trocar Whisper**: Por outros modelos de transcrição
2. **Adicionar Idiomas**: Suporte multilíngue
3. **Novos Formatos**: Adicionar outros tipos de vídeo
4. **IA Personalizada**: Treinar modelos próprios
5. **Integração**: APIs de redes sociais

---

**Sistema profissional equivalente ao OpusClip, mas totalmente seu!** 🎉
