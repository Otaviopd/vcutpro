"""
Core do processamento inteligente de vídeos
Pipeline completo: Whisper + NLP + OpenCV + FFmpeg
"""

import whisper
import cv2
import numpy as np
from pathlib import Path
import ffmpeg
from pydub import AudioSegment
import spacy
from transformers import pipeline
import asyncio
import subprocess
import json
from typing import List, Dict, Tuple
import tempfile
import os

class VideoProcessor:
    def __init__(self):
        # Carregar modelos
        self.whisper_model = whisper.load_model("base")
        self.nlp = spacy.load("pt_core_news_sm")
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis", 
            model="cardiffnlp/twitter-roberta-base-sentiment-latest"
        )
        
    async def transcribe_audio(self, video_path: Path) -> Dict:
        """Transcrição com Whisper + timestamps"""
        try:
            # Extrair áudio
            audio_path = video_path.with_suffix('.wav')
            
            # FFmpeg para extrair áudio
            (
                ffmpeg
                .input(str(video_path))
                .output(str(audio_path), acodec='pcm_s16le', ac=1, ar='16000')
                .overwrite_output()
                .run(quiet=True)
            )
            
            # Transcrever com Whisper
            result = self.whisper_model.transcribe(
                str(audio_path),
                language='pt',
                word_timestamps=True
            )
            
            # Limpar arquivo temporário
            audio_path.unlink()
            
            return {
                "text": result["text"],
                "segments": result["segments"],
                "language": result["language"]
            }
            
        except Exception as e:
            raise Exception(f"Erro na transcrição: {str(e)}")

    async def analyze_content(self, transcription: Dict) -> Dict:
        """Análise NLP para detectar frases de impacto"""
        try:
            text = transcription["text"]
            segments = transcription["segments"]
            
            # Análise com spaCy
            doc = self.nlp(text)
            
            # Detectar frases de impacto
            impact_phrases = []
            for segment in segments:
                segment_text = segment["text"]
                
                # Critérios de impacto
                score = 0
                
                # Palavras-chave de impacto
                impact_words = [
                    "incrível", "surpreendente", "chocante", "revelação",
                    "segredo", "dica", "truque", "método", "estratégia",
                    "resultado", "transformação", "mudança", "sucesso"
                ]
                
                for word in impact_words:
                    if word in segment_text.lower():
                        score += 10
                
                # Análise de sentimento
                sentiment = self.sentiment_analyzer(segment_text)[0]
                if sentiment['label'] == 'POSITIVE' and sentiment['score'] > 0.8:
                    score += 15
                
                # Perguntas retóricas
                if '?' in segment_text:
                    score += 8
                
                # Números e estatísticas
                if any(char.isdigit() for char in segment_text):
                    score += 5
                
                impact_phrases.append({
                    "text": segment_text,
                    "start": segment["start"],
                    "end": segment["end"],
                    "impact_score": score,
                    "sentiment": sentiment
                })
            
            # Ordenar por relevância
            impact_phrases.sort(key=lambda x: x["impact_score"], reverse=True)
            
            return {
                "impact_phrases": impact_phrases[:20],  # Top 20
                "total_segments": len(segments),
                "avg_impact_score": np.mean([p["impact_score"] for p in impact_phrases])
            }
            
        except Exception as e:
            raise Exception(f"Erro na análise de conteúdo: {str(e)}")

    async def detect_scenes(self, video_path: Path) -> List[Dict]:
        """Detecção de mudanças de cena com OpenCV"""
        try:
            cap = cv2.VideoCapture(str(video_path))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            scenes = []
            prev_frame = None
            frame_count = 0
            threshold = 0.3  # Limiar para mudança de cena
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Converter para escala de cinza
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                if prev_frame is not None:
                    # Calcular diferença entre frames
                    diff = cv2.absdiff(prev_frame, gray)
                    diff_score = np.mean(diff) / 255.0
                    
                    # Se diferença é significativa, nova cena
                    if diff_score > threshold:
                        timestamp = frame_count / fps
                        scenes.append({
                            "timestamp": timestamp,
                            "frame": frame_count,
                            "change_intensity": diff_score
                        })
                
                prev_frame = gray
                frame_count += 1
                
                # Processar apenas a cada 30 frames (otimização)
                if frame_count % 30 != 0:
                    continue
            
            cap.release()
            
            return scenes
            
        except Exception as e:
            raise Exception(f"Erro na detecção de cenas: {str(e)}")

    async def analyze_audio_patterns(self, video_path: Path) -> Dict:
        """Análise de padrões de áudio (pausas, silêncios)"""
        try:
            # Carregar áudio
            audio = AudioSegment.from_file(str(video_path))
            
            # Detectar silêncios
            silence_thresh = audio.dBFS - 16  # 16dB abaixo da média
            silences = []
            
            # Dividir em chunks de 100ms
            chunk_length = 100
            for i, chunk in enumerate(audio[::chunk_length]):
                if chunk.dBFS < silence_thresh:
                    timestamp = i * chunk_length / 1000.0
                    silences.append(timestamp)
            
            # Agrupar silêncios próximos
            grouped_silences = []
            if silences:
                current_start = silences[0]
                current_end = silences[0]
                
                for silence in silences[1:]:
                    if silence - current_end < 0.5:  # Menos de 500ms de diferença
                        current_end = silence
                    else:
                        if current_end - current_start > 1.0:  # Silêncio > 1s
                            grouped_silences.append({
                                "start": current_start,
                                "end": current_end,
                                "duration": current_end - current_start
                            })
                        current_start = silence
                        current_end = silence
            
            return {
                "silences": grouped_silences,
                "total_duration": len(audio) / 1000.0,
                "avg_volume": audio.dBFS
            }
            
        except Exception as e:
            raise Exception(f"Erro na análise de áudio: {str(e)}")

    async def generate_intelligent_clips(
        self, 
        video_path: Path, 
        transcription: Dict, 
        analysis: Dict, 
        scenes: List[Dict]
    ) -> List[Dict]:
        """Gerar cortes inteligentes baseados em todas as análises"""
        try:
            clips = []
            impact_phrases = analysis["impact_phrases"]
            
            # Configurações
            min_duration = 30  # 30 segundos mínimo
            max_duration = 90  # 90 segundos máximo
            target_count = 10  # 10 clips ideais
            
            # Selecionar melhores segmentos
            selected_segments = []
            
            for phrase in impact_phrases[:target_count]:
                start_time = max(0, phrase["start"] - 5)  # 5s antes
                end_time = min(
                    phrase["end"] + 25,  # 25s depois
                    start_time + max_duration
                )
                
                # Ajustar para duração mínima
                if end_time - start_time < min_duration:
                    end_time = start_time + min_duration
                
                # Ajustar baseado em mudanças de cena
                for scene in scenes:
                    scene_time = scene["timestamp"]
                    if start_time <= scene_time <= end_time:
                        # Ajustar corte para coincidir com mudança de cena
                        if abs(scene_time - start_time) < abs(scene_time - end_time):
                            start_time = scene_time
                        else:
                            end_time = scene_time
                
                selected_segments.append({
                    "start": start_time,
                    "end": end_time,
                    "impact_score": phrase["impact_score"],
                    "text": phrase["text"]
                })
            
            # Processar cada segmento
            for i, segment in enumerate(selected_segments):
                clip_id = f"clip_{i+1}"
                output_path = video_path.parent / f"{clip_id}_vertical.mp4"
                
                # Gerar clip com FFmpeg
                await self._create_vertical_clip(
                    video_path, 
                    output_path, 
                    segment["start"], 
                    segment["end"],
                    segment["text"]
                )
                
                clips.append({
                    "id": clip_id,
                    "filename": f"Clip_{i+1}_Viral.mp4",
                    "file_path": str(output_path),
                    "start_time": segment["start"],
                    "end_time": segment["end"],
                    "duration": segment["end"] - segment["start"],
                    "impact_score": segment["impact_score"],
                    "description": segment["text"][:100] + "...",
                    "viral_potential": min(100, int(segment["impact_score"] * 2))
                })
            
            return clips
            
        except Exception as e:
            raise Exception(f"Erro na geração de clips: {str(e)}")

    async def _create_vertical_clip(
        self, 
        input_path: Path, 
        output_path: Path, 
        start_time: float, 
        end_time: float,
        subtitle_text: str
    ):
        """Criar clip vertical 9:16 com zoom dinâmico e legendas"""
        try:
            # Comando FFmpeg otimizado para WhatsApp (100% compatibilidade)
            cmd = [
                'ffmpeg', '-y',
                '-i', str(input_path),
                '-ss', str(start_time),
                '-t', str(end_time - start_time),
                
                # Vídeo: H.264 High Profile Level 4.0 + yuv420p
                '-c:v', 'libx264',
                '-profile:v', 'high',
                '-level', '4.0',
                '-pix_fmt', 'yuv420p',
                
                # Taxa de quadros constante (CFR) 30 fps
                '-r', '30',
                '-vsync', 'cfr',
                
                # GOP otimizado (keyframes a cada 2 segundos)
                '-g', '60',
                '-keyint_min', '60',
                '-sc_threshold', '0',
                
                # Qualidade otimizada
                '-crf', '21',
                '-preset', 'medium',
                '-tune', 'film',
                
                # Áudio: AAC 128 kbps (WhatsApp padrão)
                '-c:a', 'aac',
                '-b:a', '128k',
                '-ar', '44100',
                '-ac', '2',
                
                # Formato vertical 9:16 com crop inteligente
                '-vf', (
                    'scale=1080:1920:force_original_aspect_ratio=increase,'
                    'crop=1080:1920,'
                    # Adicionar texto (legenda) se necessário
                    f'drawtext=text=\'{subtitle_text[:50]}\':'
                    'fontsize=40:'
                    'fontcolor=white:'
                    'shadowcolor=black@0.8:'
                    'shadowx=2:'
                    'shadowy=2:'
                    'x=(w-text_w)/2:'
                    'y=h-120'
                ),
                
                # Metadados otimizados
                '-movflags', '+faststart',
                '-fflags', '+genpts',
                
                str(output_path)
            ]
            
            # Executar comando
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await process.communicate()
            
        except Exception as e:
            raise Exception(f"Erro na criação do clip: {str(e)}")
