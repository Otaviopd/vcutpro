/**
 * Hook para integração com o novo sistema inteligente
 * Substitui o sistema anterior por pipeline profissional
 */

import { useState, useRef } from 'react';

export interface IntelligentClipData {
  id: string;
  filename: string;
  start_time: number;
  end_time: number;
  duration: number;
  impact_score: number;
  description: string;
  viral_potential: number;
}

export interface ProcessingProgress {
  phase: string;
  progress: number;
}

interface UseIntelligentProcessorReturn {
  isSupported: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress;
  processVideo: (videoFile: File) => Promise<string>; // Retorna job_id
  getStatus: (jobId: string) => Promise<any>;
  downloadClip: (jobId: string, clipId: string) => Promise<void>;
}

export const useIntelligentProcessor = (): UseIntelligentProcessorReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ phase: '', progress: 0 });

  // Usar sistema atual (sem backend separado)
  const API_BASE = null; // Processamento local

  // Verificar suporte (sempre true para o novo sistema)
  const isSupported = true;

  const processVideo = async (videoFile: File): Promise<string> => {
    try {
      setIsProcessing(true);
      setProgress({ phase: 'Enviando vídeo...', progress: 5 });

      // Upload do vídeo
      const formData = new FormData();
      formData.append('file', videoFile);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      const jobId = result.job_id;

      // Iniciar polling do status
      pollStatus(jobId);

      return jobId;

    } catch (error) {
      setIsProcessing(false);
      setProgress({ phase: 'Erro no processamento', progress: 0 });
      throw error;
    }
  };

  const pollStatus = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/status/${jobId}`);
      const status = await response.json();

      setProgress({
        phase: status.stage || 'Processando...',
        progress: status.progress || 0
      });

      if (status.status === 'completed') {
        setIsProcessing(false);
        setProgress({ phase: 'Concluído!', progress: 100 });
        return status;
      } else if (status.status === 'error') {
        setIsProcessing(false);
        setProgress({ phase: 'Erro no processamento', progress: 0 });
        throw new Error(status.error);
      } else {
        // Continuar polling
        setTimeout(() => pollStatus(jobId), 2000);
      }

    } catch (error) {
      setIsProcessing(false);
      setProgress({ phase: 'Erro na verificação', progress: 0 });
      throw error;
    }
  };

  const getStatus = async (jobId: string) => {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    return response.json();
  };

  const downloadClip = async (jobId: string, clipId: string) => {
    try {
      const response = await fetch(`${API_BASE}/download/${jobId}/${clipId}`);
      
      if (!response.ok) {
        throw new Error('Erro no download');
      }

      // Criar blob e download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clipId}_viral.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro no download:', error);
      throw error;
    }
  };

  return {
    isSupported,
    isProcessing,
    progress,
    processVideo,
    getStatus,
    downloadClip
  };
};
