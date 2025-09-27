'use client';
// ATUALIZADO EM 25/09/2025 - 18:47 - VERSÃO FINAL OTIMIZADA
import { useState } from 'react';

export interface ProcessingProgress {
  phase: string;
  progress: number;
}

interface UseCanvasMP4Return {
  isSupported: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress;
  processSingleClip: (videoFile: File, start: string, end: string, title: string) => Promise<Blob>;
}

export const useCanvasMP4 = (): UseCanvasMP4Return => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ phase: '', progress: 0 });

  // Verificar suporte (disponível em todos os navegadores modernos)
  const isSupported = typeof window !== 'undefined' && 
                     'MediaRecorder' in window &&
                     'HTMLCanvasElement' in window;

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

  // Processar um único clip usando Canvas + MediaRecorder
  const processSingleClip = async (
    videoFile: File,
    start: string,
    end: string,
    title: string
  ): Promise<Blob> => {
    if (!isSupported) {
      throw new Error('Canvas/MediaRecorder não suportado neste navegador');
    }

    try {
      setIsProcessing(true);
      setProgress({ phase: `Iniciando processamento: ${title}`, progress: 0 });

      // Criar elemento de vídeo COM ÁUDIO
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.crossOrigin = 'anonymous';
      video.muted = false; // MANTER ÁUDIO
      video.volume = 1.0;   // Volume máximo
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
      });

      const startSeconds = timeToSeconds(start);
      const endSeconds = timeToSeconds(end);
      const duration = endSeconds - startSeconds;

      setProgress({ phase: `Configurando canvas: ${title}`, progress: 20 });

      // Configurar canvas otimizado para Stories
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Resolução TikTok/Stories - 9:16 alta qualidade
      canvas.width = 1080;  // Full HD width
      canvas.height = 1920; // Full HD height - perfeito para TikTok

      // Configurar stream com vídeo E ÁUDIO - 30fps para fluidez ideal
      const videoStream = canvas.captureStream(30); // 30fps fluido e estável
      
      // Captura simplificada de áudio (mais compatível)
      let audioContext: AudioContext | null = null;
      let finalStream = videoStream; // Começar só com vídeo
      
      try {
        // Tentar capturar áudio de forma mais simples
        if (video.mozCaptureStream) {
          // Firefox
          const fullStream = (video as any).mozCaptureStream();
          if (fullStream.getAudioTracks().length > 0) {
            finalStream = new MediaStream([
              ...videoStream.getVideoTracks(),
              ...fullStream.getAudioTracks()
            ]);
          }
        } else if (video.captureStream) {
          // Chrome - tentar capturar stream do elemento video
          const fullStream = (video as any).captureStream();
          if (fullStream.getAudioTracks().length > 0) {
            finalStream = new MediaStream([
              ...videoStream.getVideoTracks(),
              ...fullStream.getAudioTracks()
            ]);
          }
        }
      } catch (audioError) {
        console.warn('Audio não capturado, usando só vídeo:', audioError);
        finalStream = videoStream; // Fallback para só vídeo
      }
      
      // Tentar codecs com áudio AAC (não Opus) para compatibilidade
      let mimeType = '';
      let bitrate = 0;
      const codecs = [
        { mime: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"', bitrate: 4000000 }, // H.264 + AAC
        { mime: 'video/webm; codecs="vp9,vorbis"', bitrate: 3500000 },           // VP9 + Vorbis
        { mime: 'video/webm; codecs="vp8,vorbis"', bitrate: 3000000 },           // VP8 + Vorbis
        { mime: 'video/webm', bitrate: 2500000 }                                  // WebM genérico
      ];

      for (const codec of codecs) {
        if (MediaRecorder.isTypeSupported(codec.mime)) {
          mimeType = codec.mime;
          bitrate = codec.bitrate;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: bitrate, // Bitrate otimizado para vídeo
        audioBitsPerSecond: 128000   // 128kbps para áudio claro
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      setProgress({ phase: `Processando frames: ${title}`, progress: 40 });

      // Posicionar vídeo no tempo inicial
      video.currentTime = startSeconds;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });

      // Iniciar gravação
      mediaRecorder.start();

      // Reproduzir e capturar frames (versão que funcionava)
      video.play();
      
      let frameCount = 0;
      const fps = 30; // 30fps para fluidez ideal sem travamento
      const totalFrames = Math.floor(duration * fps);
      const frameInterval = 1000 / fps; // 33.33ms por frame

      const renderFrame = () => {
        if (video.currentTime >= endSeconds || video.ended) {
          return;
        }
        
        // Garantir que o vídeo está pronto para renderizar
        if (video.readyState < 2) {
          requestAnimationFrame(renderFrame);
          return;
        }

        // Algoritmo forçar formato TikTok 9:16 SEMPRE
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height; // 9:16 = 0.5625
        
        let drawWidth, drawHeight, drawX, drawY;

        if (videoAspect > canvasAspect) {
          // Vídeo horizontal/quadrado - CORTAR laterais para forçar vertical
          drawHeight = canvas.height;
          drawWidth = canvas.height * videoAspect;
          drawX = -(drawWidth - canvas.width) / 2; // Centralizar corte
          drawY = 0;
        } else {
          // Vídeo já vertical - ajustar para preencher
          drawWidth = canvas.width;
          drawHeight = canvas.width / videoAspect;
          drawX = 0;
          drawY = -(drawHeight - canvas.height) / 2; // Centralizar corte
        }

        // Limpar canvas com fundo preto elegante
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Melhorar qualidade do redimensionamento
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Desenhar frame do vídeo com alta qualidade
        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

        frameCount++;
        const progressPercent = 40 + (frameCount / totalFrames) * 40;
        setProgress({ 
          phase: `Frame ${frameCount}/${totalFrames}`, 
          progress: Math.round(progressPercent) 
        });

        // Continuar captura com timing simples (que funcionava)
        if (video.currentTime < endSeconds && !video.ended) {
          setTimeout(() => {
            requestAnimationFrame(renderFrame);
          }, frameInterval);
        }
      };

      // Iniciar renderização
      renderFrame();

      // Aguardar término da gravação
      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const finalBlob = new Blob(chunks, { 
            type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm' 
          });
          resolve(finalBlob);
        };
      });

      // Parar gravação após duração
      setTimeout(() => {
        video.pause();
        mediaRecorder.stop();
        finalStream.getTracks().forEach(track => track.stop());
        
        // Limpar recursos de áudio
        if (audioContext) {
          audioContext.close();
        }
      }, duration * 1000);

      setProgress({ phase: `Finalizando: ${title}`, progress: 90 });

      const resultBlob = await recordingPromise;

      // Limpar recursos
      URL.revokeObjectURL(video.src);

      setProgress({ phase: `Concluído: ${title}`, progress: 100 });
      setIsProcessing(false);

      return resultBlob;

    } catch (error) {
      console.error('Erro no processamento com Canvas:', error);
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