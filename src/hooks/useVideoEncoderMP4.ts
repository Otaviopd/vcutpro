'use client';

import { useState, useRef } from 'react';

export interface ProcessingProgress {
  phase: string;
  progress: number;
}

export interface ClipData {
  id: number;
  start: string;
  end: string;
  title: string;
  score: number;
  type: string;
}

interface UseVideoEncoderReturn {
  isSupported: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress;
  processSingleClip: (videoFile: File, start: string, end: string, title: string) => Promise<Blob>;
}

export const useVideoEncoderMP4 = (): UseVideoEncoderReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ phase: '', progress: 0 });

  // Verificar suporte ao VideoEncoder
  const isSupported = typeof window !== 'undefined' && 
                     'VideoEncoder' in window && 
                     'VideoDecoder' in window &&
                     'AudioEncoder' in window;

  // Função para converter tempo MM:SS ou HH:MM:SS para segundos
  const timeToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Processar um único clip usando VideoEncoder API
  const processSingleClip = async (
    videoFile: File,
    start: string,
    end: string,
    title: string
  ): Promise<Blob> => {
    if (!isSupported) {
      throw new Error('VideoEncoder API não suportada neste navegador');
    }

    try {
      setIsProcessing(true);
      setProgress({ phase: `Iniciando processamento: ${title}`, progress: 0 });

      // Criar elemento de vídeo para leitura
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
      });

      const startSeconds = timeToSeconds(start);
      const endSeconds = timeToSeconds(end);
      const duration = endSeconds - startSeconds;

      setProgress({ phase: `Configurando encoder: ${title}`, progress: 20 });

      // Configurar canvas para captura de frames
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Resolução otimizada Stories (vertical) - compatível com AVC
      canvas.width = 720;  // Reduzido para compatibilidade
      canvas.height = 1280; // Mantém proporção 9:16

      // Configurar VideoEncoder
      const chunks: Uint8Array[] = [];
      let frameCount = 0;
      const fps = 30;
      const totalFrames = Math.floor(duration * fps);
      let encoderClosed = false;

      const encoder = new VideoEncoder({
        output: (chunk) => {
          if (!encoderClosed) {
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data);
            chunks.push(data);
          }
        },
        error: (error) => {
          console.error('Erro no VideoEncoder:', error);
          encoderClosed = true;
          throw error;
        }
      });

      // Configuração otimizada para MP4 compatível - AVC Level 4.0
      const config: VideoEncoderConfig = {
        codec: 'avc1.42E028', // H.264 baseline level 4.0 (suporta resolução maior)
        width: 720,
        height: 1280,
        bitrate: 1500000, // 1.5Mbps - otimizado para velocidade
        framerate: fps,
        hardwareAcceleration: 'prefer-hardware'
      };

      encoder.configure(config);

      setProgress({ phase: `Processando frames: ${title}`, progress: 40 });

      // Processar frames do vídeo
      video.currentTime = startSeconds;
      
      await new Promise<void>((resolve, reject) => {
        const processFrame = async () => {
          try {
            if (video.currentTime >= endSeconds || frameCount >= totalFrames) {
              resolve();
              return;
            }

            // Desenhar frame no canvas (ajustando para formato vertical)
            const videoAspect = video.videoWidth / video.videoHeight;
            const canvasAspect = canvas.width / canvas.height;
            
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let drawX = 0;
            let drawY = 0;

            if (videoAspect > canvasAspect) {
              // Vídeo mais largo - ajustar altura
              drawHeight = canvas.width / videoAspect;
              drawY = (canvas.height - drawHeight) / 2;
            } else {
              // Vídeo mais alto - ajustar largura
              drawWidth = canvas.height * videoAspect;
              drawX = (canvas.width - drawWidth) / 2;
            }

            // Limpar canvas com fundo preto
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Desenhar frame do vídeo
            ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

            // Criar VideoFrame
            const frame = new VideoFrame(canvas, {
              timestamp: frameCount * (1000000 / fps), // microsegundos
            });

            // Verificar se encoder ainda está ativo antes de encodar
            if (!encoderClosed && encoder.state === 'configured') {
              encoder.encode(frame, { keyFrame: frameCount % 30 === 0 });
            }
            frame.close();

            frameCount++;
            const progressPercent = 40 + (frameCount / totalFrames) * 40;
            setProgress({ 
              phase: `Frame ${frameCount}/${totalFrames}`, 
              progress: Math.round(progressPercent) 
            });

            // Avançar vídeo
            video.currentTime = startSeconds + (frameCount / fps);
            
            // Aguardar próximo frame com delay para estabilidade
            setTimeout(() => {
              requestAnimationFrame(processFrame);
            }, 33); // ~30fps

          } catch (error) {
            reject(error);
          }
        };

        video.onseeked = () => {
          processFrame();
        };
      });

      setProgress({ phase: `Finalizando: ${title}`, progress: 90 });

      // Finalizar encoding com segurança
      if (!encoderClosed && encoder.state === 'configured') {
        await encoder.flush();
        encoderClosed = true;
        encoder.close();
      }

      // Limpar recursos
      URL.revokeObjectURL(video.src);

      setProgress({ phase: `Gerando MP4: ${title}`, progress: 95 });

      // Combinar chunks em MP4
      const totalSize = chunks.reduce((size, chunk) => size + chunk.length, 0);
      const mp4Data = new Uint8Array(totalSize);
      let offset = 0;
      
      for (const chunk of chunks) {
        mp4Data.set(chunk, offset);
        offset += chunk.length;
      }

      const blob = new Blob([mp4Data], { type: 'video/mp4' });

      setProgress({ phase: `Concluído: ${title}`, progress: 100 });
      setIsProcessing(false);

      return blob;

    } catch (error) {
      console.error('Erro no processamento com VideoEncoder:', error);
      setIsProcessing(false);
      setProgress({ phase: 'Erro no processamento', progress: 0 });
      throw error;
    }
  };

  return {
    isSupported,
    isProcessing,
    progress,
    processSingleClip
  };
};