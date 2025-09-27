"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface ProgressInfo {
  phase: string;
  progress: number;
}

interface ClipData {
  id: number;
  start: string;
  end: string;
  title: string;
  score: number;
  type: string;
}

export const useCanvasVideoProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo>({ phase: '', progress: 0 });
  const [isSupported, setIsSupported] = useState(false);

  // Verificar suporte ao Canvas + MediaRecorder
  const checkSupport = useCallback(() => {
    // Verificar se estamos no browser
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return false;
    }
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasCanvas = !!ctx;
      
      if (!hasMediaRecorder || !hasCanvas) {
        setIsSupported(false);
        return false;
      }
      
      // Verificar se suporta MP4
      const supportedTypes = [
        'video/mp4',
        'video/mp4;codecs=h264',
        'video/webm;codecs=h264'
      ];
      
      const supportsMP4 = supportedTypes.some(type => 
        MediaRecorder.isTypeSupported(type)
      );
      
      const supported = hasCanvas && hasMediaRecorder && supportsMP4;
      setIsSupported(supported);
      return supported;
    } catch (error) {
      console.warn('Erro ao verificar suporte Canvas API:', error);
      setIsSupported(false);
      return false;
    }
  }, []);

  // Converter tempo para segundos
  const timeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(timeStr);
  };

  // Processar um único clip usando Canvas API
  const processSingleClip = async (
    videoFile: File,
    startTime: string,
    endTime: string,
    title: string
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      setIsProcessing(true);
      setProgress({ phase: `Preparando: ${title}...`, progress: 0 });

      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const startSeconds = timeToSeconds(startTime);
        const endSeconds = timeToSeconds(endTime);
        const duration = endSeconds - startSeconds;

        // Configurar canvas para formato vertical (Stories/TikTok)
        canvas.width = 1080;
        canvas.height = 1920;

        setProgress({ phase: `Configurando: ${title}...`, progress: 10 });

        // Configurar MediaRecorder para MP4
        const stream = canvas.captureStream(60); // 60 FPS para suavidade
        const chunks: Blob[] = [];
        
        // MediaRecorder só suporta WebM nativamente
        // Vamos usar WebM e depois converter se necessário
        const mimeTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm'
        ];

        let selectedMimeType = '';
        for (const mimeType of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType;
            break;
          }
        }

        if (!selectedMimeType) {
          throw new Error('Navegador não suporta gravação de vídeo');
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 3000000 // 3 Mbps para boa qualidade
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          // Sempre gerar WebM (formato nativo do MediaRecorder)
          const blob = new Blob(chunks, { type: 'video/webm' });
          
          setProgress({ phase: `Concluído: ${title}`, progress: 100 });
          setIsProcessing(false);
          
          // Cleanup
          URL.revokeObjectURL(video.src);
          
          resolve(blob);
        };

        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setIsProcessing(false);
          reject(new Error('Erro no MediaRecorder'));
        };

        // Função para renderizar frame
        const renderFrame = () => {
          // Verificar se chegou ao fim ou se vídeo pausou
          if (video.currentTime >= endSeconds || video.paused || video.ended) {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
            video.pause();
            return;
          }

          // Calcular escala para manter aspect ratio
          const videoAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = canvas.width / canvas.height;

          let drawWidth, drawHeight, drawX, drawY;

          if (videoAspect > canvasAspect) {
            // Vídeo é mais largo - ajustar altura
            drawHeight = canvas.height;
            drawWidth = drawHeight * videoAspect;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
          } else {
            // Vídeo é mais alto - ajustar largura
            drawWidth = canvas.width;
            drawHeight = drawWidth / videoAspect;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
          }

          // Limpar canvas
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Desenhar frame do vídeo
          ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

          // Atualizar progresso
          const currentProgress = ((video.currentTime - startSeconds) / duration) * 80 + 20;
          setProgress({ 
            phase: `Processando: ${title}... ${Math.floor(video.currentTime - startSeconds)}s/${Math.floor(duration)}s`, 
            progress: Math.min(currentProgress, 90) 
          });

          // Próximo frame
          requestAnimationFrame(renderFrame);
        };

        // Listener para parar quando chegar no tempo final
        video.ontimeupdate = () => {
          if (video.currentTime >= endSeconds) {
            video.pause();
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }
        };

        // Iniciar processamento
        video.currentTime = startSeconds;
        video.onseeked = () => {
          setProgress({ phase: `Iniciando gravação: ${title}...`, progress: 20 });
          
          // Verificar se MediaRecorder não está gravando
          if (mediaRecorder.state === 'inactive') {
            mediaRecorder.start(100); // Chunk a cada 100ms
            
            // Começar renderização
            renderFrame();
            
            // Reproduzir vídeo em velocidade normal
            video.playbackRate = 1.0;
            video.muted = true;
            
            // Iniciar reprodução do segmento
            video.play().then(() => {
              console.log('Vídeo reproduzindo para captura Canvas API');
            }).catch(err => {
              console.error('Erro ao reproduzir vídeo:', err);
              setIsProcessing(false);
              reject(err);
            });
          }
        };
      };

      video.onerror = () => {
        setIsProcessing(false);
        reject(new Error('Erro ao carregar vídeo'));
      };
    });
  };

  // Processar múltiplos clips
  const processVideo = async (
    videoFile: File,
    clips: ClipData[]
  ): Promise<{ [clipId: number]: Blob }> => {
    const results: { [clipId: number]: Blob } = {};
    
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      setProgress({ 
        phase: `Processando clip ${i + 1}/${clips.length}: ${clip.title}`, 
        progress: (i / clips.length) * 100 
      });
      
      try {
        const blob = await processSingleClip(videoFile, clip.start, clip.end, clip.title);
        results[clip.id] = blob;
      } catch (error) {
        console.error(`Erro ao processar clip ${clip.title}:`, error);
      }
    }
    
    return results;
  };

  // Verificar suporte apenas no cliente
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  return {
    isSupported,
    isProcessing,
    progress,
    processSingleClip,
    processVideo,
    checkSupport
  };
};
