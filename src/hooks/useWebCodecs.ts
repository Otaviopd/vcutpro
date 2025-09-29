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
  viralPotential: number;
  description: string;
}

interface UseWebCodecsReturn {
  isSupported: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress;
  processVideo: (videoFile: File, clips: ClipData[]) => Promise<{ [clipId: number]: Blob }>;
  processSingleClip: (videoFile: File, start: string, end: string, title: string) => Promise<Blob>;
}

export const useWebCodecs = (): UseWebCodecsReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ phase: '', progress: 0 });

  // Verificar suporte do WebCodecs
  const isSupported = typeof window !== 'undefined' && 
    'VideoEncoder' in window && 
    'VideoDecoder' in window &&
    'VideoFrame' in window;

  // Função auxiliar para converter tempo
  const timeToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Processar vídeo com WebCodecs (MUITO mais rápido)
  const processVideoWithWebCodecs = async (
    videoFile: File,
    startTime: number,
    duration: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Configurar canvas para formato vertical (Stories/TikTok)
      canvas.width = 1080;
      canvas.height = 1920;

      const chunks: Uint8Array[] = [];
      const mediaRecorder = new MediaRecorder(canvas.captureStream(30), {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then(buffer => {
            chunks.push(new Uint8Array(buffer));
          });
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      video.onloadedmetadata = () => {
        video.currentTime = startTime;
      };

      video.onseeked = () => {
        mediaRecorder.start();
        
        const startRecordingTime = Date.now();
        const targetDuration = duration * 1000; // converter para ms

        const drawFrame = () => {
          const elapsed = Date.now() - startRecordingTime;
          
          if (elapsed >= targetDuration) {
            mediaRecorder.stop();
            return;
          }

          // Desenhar frame no canvas com redimensionamento para vertical
          const videoAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = canvas.width / canvas.height;

          let drawWidth, drawHeight, offsetX, offsetY;

          if (videoAspect > canvasAspect) {
            // Vídeo mais largo - ajustar pela altura
            drawHeight = canvas.height;
            drawWidth = drawHeight * videoAspect;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
          } else {
            // Vídeo mais alto - ajustar pela largura
            drawWidth = canvas.width;
            drawHeight = drawWidth / videoAspect;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
          }

          // Limpar canvas
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Desenhar vídeo redimensionado
          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

          // Atualizar progresso
          const progressPercent = (elapsed / targetDuration) * 100;
          setProgress(prev => ({
            ...prev,
            progress: Math.min(progressPercent, 100)
          }));

          // Próximo frame
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      };

      video.onerror = reject;
      video.src = URL.createObjectURL(videoFile);
      video.load();
    });
  };

  // Processar um único clip
  const processSingleClip = async (
    videoFile: File,
    start: string,
    end: string,
    title: string
  ): Promise<Blob> => {
    if (!isSupported) {
      throw new Error('WebCodecs não é suportado neste navegador. Use Chrome/Edge mais recente.');
    }

    setIsProcessing(true);
    setProgress({ phase: `Processando: ${title}...`, progress: 0 });

    try {
      const startSeconds = timeToSeconds(start);
      const endSeconds = timeToSeconds(end);
      const duration = endSeconds - startSeconds;

      const blob = await processVideoWithWebCodecs(videoFile, startSeconds, duration);
      
      setProgress({ phase: `Concluído: ${title}`, progress: 100 });
      return blob;

    } catch (error) {
      console.error('Erro no processamento WebCodecs:', error);
      setProgress({ phase: 'Erro no processamento', progress: 0 });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Processar múltiplos clips
  const processVideo = async (
    videoFile: File,
    clips: ClipData[]
  ): Promise<{ [clipId: number]: Blob }> => {
    if (!isSupported) {
      throw new Error('WebCodecs não é suportado neste navegador. Use Chrome/Edge mais recente.');
    }

    setIsProcessing(true);
    const results: { [clipId: number]: Blob } = {};

    try {
      setProgress({ phase: 'Preparando processamento...', progress: 0 });

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const baseProgress = (i / clips.length) * 100;

        setProgress({
          phase: `Processando: ${clip.title} (${i + 1}/${clips.length})...`,
          progress: baseProgress
        });

        const startSeconds = timeToSeconds(clip.start);
        const endSeconds = timeToSeconds(clip.end);
        const duration = endSeconds - startSeconds;

        const blob = await processVideoWithWebCodecs(videoFile, startSeconds, duration);
        results[clip.id] = blob;

        setProgress({
          phase: `Clip ${i + 1}/${clips.length} concluído`,
          progress: Math.round(((i + 1) / clips.length) * 100)
        });
      }

      setProgress({ phase: 'Todos os clips processados!', progress: 100 });
      return results;

    } catch (error) {
      console.error('Erro no processamento de múltiplos clips:', error);
      setProgress({ phase: 'Erro no processamento', progress: 0 });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isSupported,
    isProcessing,
    progress,
    processVideo,
    processSingleClip
  };
};

// Função para download automático
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default useWebCodecs;