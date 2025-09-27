import { useState, useRef } from 'react';

export interface ProcessingProgress {
  phase: string;
  progress: number;
}

export interface ClipData {
  id: number;
  start: string; // formato "MM:SS" ou "HH:MM:SS"
  end: string;   // formato "MM:SS" ou "HH:MM:SS"
  title: string;
  score: number;
  type: string;
}

interface UseFFmpegReturn {
  isLoaded: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress;
  loadFFmpeg: () => Promise<void>;
  processVideo: (videoFile: File, clips: ClipData[]) => Promise<{ [clipId: number]: Blob }>;
  processSingleClip: (videoFile: File, start: string, end: string, title: string) => Promise<Blob>;
}

export const useFFmpeg = (): UseFFmpegReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ phase: '', progress: 0 });
  const ffmpegRef = useRef<any>(null);

  // Função auxiliar para converter tempo em formato MM:SS ou HH:MM:SS para segundos
  const timeToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };


  // Carregar FFmpeg com importação dinâmica
  const loadFFmpeg = async (): Promise<void> => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('FFmpeg só pode ser carregado no navegador');
      }

      if (isLoaded && ffmpegRef.current) {
        return;
      }

      setProgress({ phase: 'Carregando FFmpeg...', progress: 0 });

      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      // Configurar logs e progresso
      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]:', message);
      });

      ffmpeg.on('progress', ({ progress: progressValue }) => {
        setProgress(prev => ({ 
          ...prev, 
          progress: Math.round(progressValue * 100) 
        }));
      });

      setProgress({ phase: 'Inicializando FFmpeg...', progress: 30 });

      // Carregar FFmpeg versão otimizada
      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/esm/ffmpeg-core.wasm',
        workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/esm/ffmpeg-core.worker.js',
      });

      setProgress({ phase: 'FFmpeg carregado com sucesso!', progress: 100 });
      setIsLoaded(true);

      console.log('FFmpeg carregado com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar FFmpeg:', error);
      setProgress({ phase: 'Erro ao carregar FFmpeg', progress: 0 });
      setIsLoaded(false);
      throw error;
    }
  };

  // Processar um único clip
  const processSingleClip = async (
    videoFile: File, 
    start: string, 
    end: string, 
    title: string
  ): Promise<Blob> => {
    try {
      // CORREÇÃO DO BUG: Verificar se FFmpeg está carregado e inicializar se necessário
      if (!ffmpegRef.current || !isLoaded) {
        console.log('FFmpeg não está carregado. Carregando...');
        await loadFFmpeg();
      }

      setIsProcessing(true);
      const ffmpeg = ffmpegRef.current;

      setProgress({ phase: `Processando: ${title}...`, progress: 0 });

      // Preparar arquivos
      const inputFileName = 'input.mp4';
      const outputFileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

      const { fetchFile } = await import('@ffmpeg/util');

      // Escrever arquivo de entrada
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
      setProgress({ phase: `Processando: ${title}...`, progress: 20 });

      // Calcular duração
      const startSeconds = timeToSeconds(start);
      const endSeconds = timeToSeconds(end);
      const duration = endSeconds - startSeconds;
      setProgress({ phase: `Cortando: ${title}...`, progress: 40 });

      // Executar comando FFmpeg ULTRA-OTIMIZADO
      await ffmpeg.exec([
        '-i', inputFileName,
        '-ss', start,
        '-t', duration.toString(),
        '-c:v', 'libx264',
        '-preset', 'ultrafast',  // ULTRA RÁPIDO
        '-crf', '28',            // Qualidade boa mas rápida
        '-c:a', 'aac',
        '-b:a', '96k',           // Audio menor
        '-movflags', '+faststart',
        '-threads', '0',         // Usar todos os cores
        '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
        '-y',                    // Sobrescrever sem perguntar
        outputFileName
      ]);

      setProgress({ phase: `Finalizando: ${title}...`, progress: 80 });

      const outputData = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([outputData], { type: 'video/mp4' });

      setProgress({ phase: `Concluído: ${title}`, progress: 100 });

      setIsProcessing(false);
      
      // Limpeza segura
      setTimeout(async () => {
        try {
          if (ffmpegRef.current) {
            await ffmpeg.deleteFile(inputFileName);
            await ffmpeg.deleteFile(outputFileName);
          }
        } catch (cleanupError) {
          // Ignorar erros de limpeza
        }
      }, 100);

      return blob;

    } catch (error) {
      console.error('Erro no processamento do clip:', error);
      setIsProcessing(false);
      setProgress({ phase: 'Erro no processamento', progress: 0 });
      
      // Limpeza segura em caso de erro
      setTimeout(async () => {
        try {
          if (ffmpegRef.current) {
            await ffmpegRef.current.deleteFile('input.mp4');
            await ffmpegRef.current.deleteFile(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`);
          }
        } catch (cleanupError) {
          // Ignorar erros de limpeza
        }
      }, 100);
      
      throw error;
    }
  };

  const processVideo = async (
    videoFile: File, 
    clips: ClipData[]
  ): Promise<{ [clipId: number]: Blob }> => {
    try {
      // Carregar FFmpeg automaticamente se não estiver carregado
      if (!ffmpegRef.current || !isLoaded) {
        console.log('FFmpeg não está carregado. Carregando...');
        await loadFFmpeg();
      }

      if (!ffmpegRef.current || !isLoaded) {
        throw new Error('FFmpeg não pôde ser carregado.');
      }

      setIsProcessing(true);
      const results: { [clipId: number]: Blob } = {};
      const ffmpeg = ffmpegRef.current;

      setProgress({ phase: 'Preparando processamento...', progress: 0 });

      const { fetchFile } = await import('@ffmpeg/util');
      const inputFileName = 'input.mp4';

      // Escrever arquivo de entrada uma vez
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
      
      let processedClips = 0;
      const totalClips = clips.length;

      for (const clip of clips) {
        try {
          const clipProgress = (processedClips / totalClips) * 100;
          setProgress({ 
            phase: `Processando: ${clip.title} (${processedClips + 1}/${totalClips})...`, 
            progress: clipProgress 
          });

          const outputFileName = `clip_${clip.id}.mp4`;

          // Calcular duração
          const startSeconds = timeToSeconds(clip.start);
          const endSeconds = timeToSeconds(clip.end);
          const duration = endSeconds - startSeconds;

          // Executar comando FFmpeg ULTRA-OTIMIZADO para vídeos longos
          await ffmpeg.exec([
            '-i', inputFileName,
            '-ss', startSeconds.toString(),
            '-t', duration.toString(),
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-tune', 'zerolatency',
            '-threads', '0',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            outputFileName
          ]);

          // Ler e armazenar resultado
          const outputData = await ffmpeg.readFile(outputFileName);
          results[clip.id] = new Blob([outputData], { type: 'video/mp4' });

          // Limpeza do arquivo de saída
          try {
            await ffmpeg.deleteFile(outputFileName);
          } catch (cleanupError) {
            console.warn(`Erro ao limpar arquivo ${outputFileName}:`, cleanupError);
          }

          processedClips++;
        } catch (clipError) {
          console.error(`Erro ao processar clip ${clip.id}:`, clipError);
          // Continua com os próximos clips mesmo se um falhar
          processedClips++;
        }
      }

      // Limpeza final
      try {
        await ffmpeg.deleteFile(inputFileName);
      } catch (cleanupError) {
        console.warn('Erro na limpeza final:', cleanupError);
      }

      setProgress({ 
        phase: `Processamento concluído: ${Object.keys(results).length}/${totalClips} clips`, 
        progress: 100 
      });
      
      setIsProcessing(false);
      return results;

    } catch (error) {
      console.error('Erro no processamento de múltiplos clips:', error);
      setIsProcessing(false);
      setProgress({ phase: 'Erro no processamento', progress: 0 });
      
      // Tentativa de limpeza em caso de erro
      try {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg) {
          await ffmpeg.deleteFile('input.mp4');
          // Tentar limpar possíveis arquivos de clip restantes
          for (const clip of clips) {
            try {
              await ffmpeg.deleteFile(`clip_${clip.id}.mp4`);
            } catch (cleanupError) {
              // Ignora erros de limpeza individual
            }
          }
        }
      } catch (cleanupError) {
        console.warn('Erro na limpeza após falha:', cleanupError);
      }
      
      throw error;
    }
  };

  return {
    isLoaded,
    isProcessing,
    progress,
    loadFFmpeg,
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

export default useFFmpeg;