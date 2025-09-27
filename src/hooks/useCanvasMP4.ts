'use client';
// ATUALIZADO EM 25/09/2025 - 18:49 - VERSÃO FINAL TIKTOK

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

  // Detectar FPS do vídeo original (OTIMIZAÇÃO 1)
  const detectVideoFPS = async (video: HTMLVideoElement): Promise<number> => {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();
      const maxSamples = 30;
      
      const countFrames = () => {
        frameCount++;
        if (frameCount < maxSamples) {
          requestAnimationFrame(countFrames);
        } else {
          const elapsed = performance.now() - startTime;
          const detectedFPS = Math.round((frameCount / elapsed) * 1000);
          
          // Padronizar para FPS comuns
          if (detectedFPS >= 55) resolve(60);
          else if (detectedFPS >= 45) resolve(50);
          else if (detectedFPS >= 28) resolve(30);
          else if (detectedFPS >= 22) resolve(24);
          else resolve(30); // Fallback seguro
        }
      };
      
      requestAnimationFrame(countFrames);
    });
  };

  // Configurações por plataforma (OTIMIZAÇÃO 2)
  const getPlatformSettings = (platform: string = 'default') => {
    const settings = {
      whatsapp: {
        width: 720, height: 1280,
        fps: 24, videoBitrate: 1500000, audioBitrate: 96000
      },
      tiktok: {
        width: 1080, height: 1920,
        fps: 30, videoBitrate: 2500000, audioBitrate: 128000
      },
      instagram: {
        width: 1080, height: 1920,
        fps: 30, videoBitrate: 3000000, audioBitrate: 128000
      },
      default: {
        width: 1080, height: 1920,
        fps: 30, videoBitrate: 4000000, audioBitrate: 128000
      }
    };
    return settings[platform as keyof typeof settings] || settings.default;
  };

  // Processar um único clip usando Canvas + MediaRecorder
  const processSingleClip = async (
    videoFile: File,
    start: string,
    end: string,
    title: string,
    platform: string = 'default'
  ): Promise<Blob> => {
    if (!isSupported) {
      throw new Error('Canvas/MediaRecorder não suportado neste navegador');
    }

    try {
      setIsProcessing(true);
      setProgress({ phase: 'Iniciando processamento...', progress: 0 });

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

      setProgress({ phase: 'Detectando FPS original...', progress: 15 });
      
      // OTIMIZAÇÃO 1: Detectar FPS original
      video.currentTime = startSeconds + (duration * 0.1);
      await new Promise(resolve => video.onseeked = resolve);
      
      const originalFPS = await detectVideoFPS(video);
      console.log('FPS detectado:', originalFPS);

      setProgress({ phase: 'Configurando canvas otimizado...', progress: 20 });

      // OTIMIZAÇÃO 2: Configurações por plataforma
      const platformConfig = getPlatformSettings(platform);
      const targetFPS = Math.min(originalFPS, platformConfig.fps);
      
      // Configurar canvas com configurações otimizadas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = platformConfig.width;
      canvas.height = platformConfig.height;

      // Stream com FPS otimizado
      const videoStream = canvas.captureStream(targetFPS);
      
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
        { mime: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"', bitrate: platformConfig.videoBitrate }, // H.264 + AAC otimizado
        { mime: 'video/webm; codecs="vp9,vorbis"', bitrate: platformConfig.videoBitrate * 0.8 },     // VP9 + Vorbis
        { mime: 'video/webm; codecs="vp8,vorbis"', bitrate: platformConfig.videoBitrate * 0.7 },     // VP8 + Vorbis
        { mime: 'video/webm', bitrate: platformConfig.videoBitrate * 0.6 }                            // WebM genérico
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
        videoBitsPerSecond: bitrate, // Bitrate otimizado por plataforma
        audioBitsPerSecond: platformConfig.audioBitrate   // Áudio otimizado por plataforma
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      setProgress({ phase: 'Processando frames...', progress: 40 });

      // Posicionar vídeo no tempo inicial
      video.currentTime = startSeconds;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });

      // Iniciar gravação
      mediaRecorder.start();

      // Reproduzir e capturar frames (versão que funcionava)
      video.play();
      
      // OTIMIZAÇÃO 3: Timing preciso de renderização
      let frameCount = 0;
      const totalFrames = Math.floor(duration * targetFPS);
      const frameInterval = 1000 / targetFPS;
      let lastFrameTime = performance.now();
      let accumulatedTime = 0;

      const renderFrame = () => {
        if (video.currentTime >= endSeconds || video.ended) {
          return;
        }
        
        // Timing preciso com acumulação
        const currentTime = performance.now();
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        accumulatedTime += deltaTime;
        
        // Renderizar apenas quando necessário
        if (accumulatedTime >= frameInterval) {
          accumulatedTime -= frameInterval;
          
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

        }
        
        // Continuar com timing otimizado
        if (video.currentTime < endSeconds && !video.ended) {
          requestAnimationFrame(renderFrame);
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

      setProgress({ phase: 'Finalizando...', progress: 90 });

      const resultBlob = await recordingPromise;

      // Limpar recursos
      URL.revokeObjectURL(video.src);

      setProgress({ phase: 'Concluído!', progress: 100 });
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
