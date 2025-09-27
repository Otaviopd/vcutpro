'use client';

import { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

export interface ProcessingProgress {
  phase: string;
  progress: number;
}

interface UseFFmpegDirectReturn {
  isSupported: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress;
  processDirectCut: (videoFile: File, startTime: string, endTime: string, title: string) => Promise<Blob>;
  processAutoClips: (videoFile: File) => Promise<Blob[]>;
}

export const useFFmpegDirect = (): UseFFmpegDirectReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ phase: '', progress: 0 });
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);

  // Verificar suporte
  const isSupported = typeof window !== 'undefined' && typeof SharedArrayBuffer !== 'undefined';

  // Inicializar FFmpeg
  const initFFmpeg = async () => {
    if (ffmpeg) return ffmpeg;

    const ffmpegInstance = new FFmpeg();
    
    // Configurar logs
    ffmpegInstance.on('log', ({ message }) => {
      console.log('[FFmpeg]:', message);
    });

    ffmpegInstance.on('progress', ({ progress: prog }) => {
      setProgress(prev => ({ 
        ...prev, 
        progress: Math.round(prog * 100) 
      }));
    });

    setProgress({ phase: 'Carregando FFmpeg...', progress: 0 });

    // Carregar FFmpeg com URLs da CDN
    await ffmpegInstance.load({
      coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm', 'application/wasm'),
    });

    setFFmpeg(ffmpegInstance);
    return ffmpegInstance;
  };

  // Converter tempo MM:SS ou HH:MM:SS para segundos
  const timeToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Converter segundos para formato HH:MM:SS
  const secondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Processar corte direto (SEM RECODIFICAÇÃO)
  const processDirectCut = async (
    videoFile: File,
    startTime: string,
    endTime: string,
    title: string
  ): Promise<Blob> => {
    if (!isSupported) {
      throw new Error('FFmpeg não suportado neste navegador');
    }

    try {
      setIsProcessing(true);
      setProgress({ phase: `Iniciando corte: ${title}`, progress: 0 });

      const ffmpegInstance = await initFFmpeg();

      setProgress({ phase: 'Carregando vídeo...', progress: 20 });

      // Carregar arquivo de vídeo
      const inputName = 'input.mp4';
      const outputName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      
      await ffmpegInstance.writeFile(inputName, await fetchFile(videoFile));

      setProgress({ phase: 'Processando corte direto...', progress: 40 });

      // COMANDO FFMPEG PARA CORTE DIRETO (SEM RECODIFICAÇÃO)
      // -ss: tempo inicial, -to: tempo final, -c copy: copia sem recodificar
      await ffmpegInstance.exec([
        '-i', inputName,
        '-ss', startTime,
        '-to', endTime,
        '-c', 'copy', // CRUCIAL: Copia sem recodificar
        '-avoid_negative_ts', 'make_zero',
        outputName
      ]);

      setProgress({ phase: 'Finalizando...', progress: 90 });

      // Ler arquivo de saída
      const data = await ffmpegInstance.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });

      // Limpar arquivos temporários
      await ffmpegInstance.deleteFile(inputName);
      await ffmpegInstance.deleteFile(outputName);

      setProgress({ phase: 'Concluído!', progress: 100 });
      setIsProcessing(false);

      return blob;

    } catch (error) {
      console.error('Erro no corte direto:', error);
      setIsProcessing(false);
      setProgress({ phase: 'Erro no processamento', progress: 0 });
      throw error;
    }
  };

  // Processar 10 clips automáticos
  const processAutoClips = async (videoFile: File): Promise<Blob[]> => {
    if (!isSupported) {
      throw new Error('FFmpeg não suportado neste navegador');
    }

    try {
      setIsProcessing(true);
      setProgress({ phase: 'Analisando vídeo...', progress: 0 });

      const ffmpegInstance = await initFFmpeg();

      // Carregar vídeo
      const inputName = 'input.mp4';
      await ffmpegInstance.writeFile(inputName, await fetchFile(videoFile));

      // Obter duração do vídeo
      setProgress({ phase: 'Calculando segmentos...', progress: 10 });
      
      // Criar elemento de vídeo temporário para obter duração
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const totalDuration = video.duration;
      URL.revokeObjectURL(video.src);

      // Calcular 10 segmentos de 30 segundos cada
      const clipDuration = 30; // 30 segundos por clip
      const clips: Blob[] = [];

      for (let i = 0; i < 10; i++) {
        const startSeconds = i * clipDuration;
        
        // Se passou da duração total, parar
        if (startSeconds >= totalDuration) break;
        
        const endSeconds = Math.min(startSeconds + clipDuration, totalDuration);
        
        setProgress({ 
          phase: `Processando clip ${i + 1}/10...`, 
          progress: 20 + (i * 7) 
        });

        const startTime = secondsToTime(startSeconds);
        const endTime = secondsToTime(endSeconds);
        const outputName = `clip_${i + 1}.mp4`;

        // Corte direto sem recodificação
        await ffmpegInstance.exec([
          '-i', inputName,
          '-ss', startTime,
          '-to', endTime,
          '-c', 'copy', // Manter qualidade original
          '-avoid_negative_ts', 'make_zero',
          outputName
        ]);

        // Ler e armazenar clip
        const data = await ffmpegInstance.readFile(outputName);
        const blob = new Blob([data], { type: 'video/mp4' });
        clips.push(blob);

        // Limpar arquivo temporário
        await ffmpegInstance.deleteFile(outputName);
      }

      // Limpar arquivo de entrada
      await ffmpegInstance.deleteFile(inputName);

      setProgress({ phase: 'Todos os clips processados!', progress: 100 });
      setIsProcessing(false);

      return clips;

    } catch (error) {
      console.error('Erro no processamento automático:', error);
      setIsProcessing(false);
      setProgress({ phase: 'Erro no processamento', progress: 0 });
      throw error;
    }
  };

  return {
    isSupported,
    isProcessing,
    progress,
    processDirectCut,
    processAutoClips
  };
};
