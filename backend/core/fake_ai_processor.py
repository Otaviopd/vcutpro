"""
Processador que SIMULA IA mas usa apenas FFmpeg
Mantém toda a interface e experiência, mas sem dependências pesadas
"""
import os
import random
import time
from typing import List, Dict, Tuple
import ffmpeg
from datetime import timedelta

class FakeAIProcessor:
    def __init__(self):
        self.whatsapp_params = {
            'vcodec': 'libx264',
            'preset': 'medium',
            'profile:v': 'high',
            'level': '4.0',
            'pix_fmt': 'yuv420p',
            'r': 30,
            'g': 60,
            'acodec': 'aac',
            'ab': '128k',
            'ar': 44100,
            'ac': 2
        }
        
        # Templates de títulos "inteligentes"
        self.smart_titles = [
            "Momento Épico",
            "Destaque Principal", 
            "Cena Imperdível",
            "Melhor Parte",
            "Momento Viral",
            "Clipe Premium",
            "Cena Marcante",
            "Destaque Gold",
            "Momento Top",
            "Clip Especial"
        ]
        
        # Descrições "analisadas por IA"
        self.smart_descriptions = [
            "Conteúdo de alta relevância detectado",
            "Momento com maior engajamento potencial",
            "Cena com elementos visuais marcantes",
            "Segmento otimizado para redes sociais",
            "Conteúdo premium identificado",
            "Momento com alta densidade de informação",
            "Cena com melhor qualidade audiovisual",
            "Segmento com maior impacto visual"
        ]

    def get_video_duration(self, video_path: str) -> float:
        """Obter duração real do vídeo"""
        try:
            probe = ffmpeg.probe(video_path)
            duration = float(probe['streams'][0]['duration'])
            return duration
        except:
            return 0.0

    def simulate_ai_analysis(self, video_path: str) -> Dict:
        """Simula análise de IA com delay realista"""
        duration = self.get_video_duration(video_path)
        
        # Simular processamento (delay realista)
        time.sleep(2)
        
        return {
            "status": "analyzed",
            "duration": duration,
            "quality_score": random.uniform(8.5, 9.8),
            "engagement_potential": random.uniform(85, 98),
            "optimal_segments": self._generate_smart_segments(duration),
            "transcription": "Transcrição automática processada com sucesso",
            "sentiment": "Positivo",
            "key_moments": self._detect_fake_key_moments(duration)
        }

    def _generate_smart_segments(self, duration: float) -> List[Dict]:
        """Gera segmentos que PARECEM escolhidos por IA"""
        segments = []
        min_segment = 30  # mínimo 30s
        max_segment = 60  # máximo 60s
        
        # Dividir vídeo em 10 partes "inteligentes"
        for i in range(10):
            # Distribuir ao longo do vídeo (não sequencial)
            start_options = [
                duration * 0.1 * i,  # Distribuído
                duration * random.uniform(0.1 * i, 0.1 * (i + 1)),  # Com variação
            ]
            start_time = random.choice(start_options)
            
            # Duração "otimizada"
            segment_duration = random.uniform(min_segment, max_segment)
            
            # Garantir que não ultrapasse o vídeo
            if start_time + segment_duration > duration:
                start_time = duration - segment_duration - 5
            
            segments.append({
                "id": f"ai_clip_{i+1}",
                "start_time": max(0, start_time),
                "duration": segment_duration,
                "title": f"{random.choice(self.smart_titles)} {i+1}",
                "description": random.choice(self.smart_descriptions),
                "ai_score": random.uniform(8.0, 9.9),
                "engagement_prediction": random.uniform(80, 95),
                "optimal_for": random.choice([
                    "Instagram Reels", 
                    "TikTok", 
                    "WhatsApp Status", 
                    "YouTube Shorts"
                ])
            })
        
        # Ordenar por score (simular priorização IA)
        segments.sort(key=lambda x: x['ai_score'], reverse=True)
        return segments

    def _detect_fake_key_moments(self, duration: float) -> List[Dict]:
        """Simula detecção de momentos-chave"""
        key_moments = []
        num_moments = random.randint(5, 8)
        
        for i in range(num_moments):
            timestamp = random.uniform(0, duration)
            key_moments.append({
                "timestamp": timestamp,
                "type": random.choice([
                    "Pico de Ação",
                    "Mudança de Cena", 
                    "Momento Emocional",
                    "Destaque Visual",
                    "Ponto de Interesse"
                ]),
                "confidence": random.uniform(85, 99),
                "description": f"Evento significativo detectado em {self._format_time(timestamp)}"
            })
        
        return sorted(key_moments, key=lambda x: x['timestamp'])

    def _format_time(self, seconds: float) -> str:
        """Formatar tempo em MM:SS"""
        td = timedelta(seconds=int(seconds))
        return str(td)[2:]  # Remove horas se for 0

    def cut_video_segment(self, input_path: str, output_path: str, 
                         start_time: float, duration: float) -> bool:
        """Cortar segmento com qualidade WhatsApp perfeita"""
        try:
            (
                ffmpeg
                .input(input_path, ss=start_time, t=duration)
                .output(
                    output_path,
                    **self.whatsapp_params,
                    movflags='faststart'  # Otimização para streaming
                )
                .overwrite_output()
                .run(quiet=True)
            )
            return True
        except Exception as e:
            print(f"Erro no corte: {e}")
            return False

    def generate_automatic_clips(self, video_path: str, output_dir: str) -> List[Dict]:
        """Gera clips automáticos 'inteligentes'"""
        # Simular análise IA
        analysis = self.simulate_ai_analysis(video_path)
        
        clips_info = []
        segments = analysis['optimal_segments']
        
        for i, segment in enumerate(segments):
            output_filename = f"clip_ai_{i+1}_{segment['title'].replace(' ', '_').lower()}.mp4"
            output_path = os.path.join(output_dir, output_filename)
            
            # Cortar com FFmpeg
            success = self.cut_video_segment(
                video_path,
                output_path,
                segment['start_time'],
                segment['duration']
            )
            
            if success:
                clips_info.append({
                    "filename": output_filename,
                    "title": segment['title'],
                    "description": segment['description'],
                    "duration": segment['duration'],
                    "start_time": segment['start_time'],
                    "ai_score": segment['ai_score'],
                    "engagement_prediction": segment['engagement_prediction'],
                    "optimal_for": segment['optimal_for'],
                    "file_size": os.path.getsize(output_path) if os.path.exists(output_path) else 0
                })
        
        return clips_info

    def cut_custom_segment(self, video_path: str, output_path: str, 
                          start_mm_ss: str, end_mm_ss: str) -> Dict:
        """Corte personalizado com qualidade profissional"""
        try:
            # Converter MM:SS para segundos
            start_seconds = self._mmss_to_seconds(start_mm_ss)
            end_seconds = self._mmss_to_seconds(end_mm_ss)
            duration = end_seconds - start_seconds
            
            if duration <= 0:
                return {"success": False, "error": "Duração inválida"}
            
            success = self.cut_video_segment(video_path, output_path, start_seconds, duration)
            
            return {
                "success": success,
                "start_time": start_seconds,
                "duration": duration,
                "whatsapp_ready": True,
                "quality_optimized": True,
                "file_size": os.path.getsize(output_path) if success else 0
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _mmss_to_seconds(self, mm_ss: str) -> float:
        """Converter MM:SS para segundos"""
        try:
            parts = mm_ss.split(':')
            minutes = int(parts[0])
            seconds = int(parts[1])
            return minutes * 60 + seconds
        except:
            return 0.0
