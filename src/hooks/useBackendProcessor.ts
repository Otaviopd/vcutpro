import { useState } from 'react';
import { BACKEND_CONFIG, buildUrl } from '@/config/backend';

export interface BackendClipData {
  id: string;
  filename: string;
  file_path: string;
  start_time: number;
  end_time: number;
  duration: number;
  impact_score?: number;
  description: string;
  viral_potential?: number;
}

export interface JobStatus {
  status: 'processing' | 'completed' | 'error';
  progress: number;
  stage: string;
  clips: BackendClipData[];
  error?: string;
}

export const useBackendProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');

  // Upload e processamento com IA
  const processWithAI = async (videoFile: File): Promise<BackendClipData[]> => {
    setIsProcessing(true);
    setProgress(0);
    setStage('Enviando vídeo...');

    try {
      const formData = new FormData();
      formData.append('file', videoFile);

      // Upload
      const uploadResponse = await fetch(buildUrl(BACKEND_CONFIG.ENDPOINTS.UPLOAD), {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Erro no upload');
      }

      const { job_id } = await uploadResponse.json();

      // Polling do status
      return await pollJobStatus(job_id);
    } catch (error) {
      console.error('Erro no processamento:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Corte manual
  const processManualCut = async (
    videoFile: File,
    startTime: string,
    endTime: string,
    title: string
  ): Promise<BackendClipData> => {
    setIsProcessing(true);
    setProgress(0);
    setStage('Processando corte...');

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
      formData.append('title', title);

      // Upload e processamento
      const response = await fetch(buildUrl(BACKEND_CONFIG.ENDPOINTS.MANUAL_CUT), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no corte manual');
      }

      const { job_id } = await response.json();

      // Polling do status
      const clips = await pollJobStatus(job_id);
      return clips[0]; // Retorna o primeiro (e único) clip
    } catch (error) {
      console.error('Erro no corte manual:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Polling do status do job
  const pollJobStatus = async (jobId: string): Promise<BackendClipData[]> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(buildUrl(BACKEND_CONFIG.ENDPOINTS.STATUS, jobId));
          
          if (!response.ok) {
            throw new Error('Erro ao verificar status');
          }

          const status: JobStatus = await response.json();
          
          setProgress(status.progress);
          setStage(status.stage);

          if (status.status === 'completed') {
            clearInterval(interval);
            resolve(status.clips);
          } else if (status.status === 'error') {
            clearInterval(interval);
            reject(new Error(status.error || 'Erro no processamento'));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, BACKEND_CONFIG.POLLING_INTERVAL);
    });
  };

  // Download do clip
  const downloadClip = async (jobId: string, clipId: string, filename: string) => {
    try {
      const response = await fetch(buildUrl(BACKEND_CONFIG.ENDPOINTS.DOWNLOAD, jobId, clipId));
      
      if (!response.ok) {
        throw new Error('Erro no download');
      }

      const blob = await response.blob();
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro no download:', error);
      throw error;
    }
  };

  return {
    isProcessing,
    progress,
    stage,
    processWithAI,
    processManualCut,
    downloadClip,
  };
};
