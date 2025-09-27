'use client';

import React, { useState, useRef } from 'react';
import { useFFmpegDirect } from '../hooks/useFFmpegDirect';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface VideoProcessorProps {
  onLogout: () => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({ onLogout }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('00:30');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [processedClips, setProcessedClips] = useState<Blob[]>([]);
  const [processingMode, setProcessingMode] = useState<'auto' | 'custom'>('auto');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { isSupported, isProcessing, progress, processDirectCut, processAutoClips } = useFFmpegDirect();

  // Converter segundos para MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Converter MM:SS para segundos
  const parseTime = (timeStr: string): number => {
    const [mins, secs] = timeStr.split(':').map(Number);
    return mins * 60 + secs;
  };

  // Lidar com seleção de arquivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      
      // Obter duração do vídeo
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        setEndTime(formatTime(Math.min(30, video.duration))); // Padrão 30s ou duração total
      };
    }
  };

  // Processar corte customizado
  const handleCustomCut = async () => {
    if (!videoFile) return;

    try {
      const title = customTitle || `Corte_${startTime}_${endTime}`;
      const blob = await processDirectCut(videoFile, startTime, endTime, title);
      setProcessedClips([blob]);
    } catch (error) {
      console.error('Erro no corte customizado:', error);
      alert('Erro ao processar vídeo. Tente novamente.');
    }
  };

  // Processar clips automáticos
  const handleAutoCut = async () => {
    if (!videoFile) return;

    try {
      const clips = await processAutoClips(videoFile);
      setProcessedClips(clips);
    } catch (error) {
      console.error('Erro no corte automático:', error);
      alert('Erro ao processar vídeo. Tente novamente.');
    }
  };

  // Download de clip
  const downloadClip = (blob: Blob, index: number) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = processingMode === 'auto' 
      ? `VCUT_Clip_${index + 1}.mp4` 
      : `VCUT_${customTitle || 'Corte'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Definir tempo atual do vídeo como início
  const setCurrentTimeAsStart = () => {
    if (videoRef.current) {
      setStartTime(formatTime(videoRef.current.currentTime));
    }
  };

  // Definir tempo atual do vídeo como fim
  const setCurrentTimeAsEnd = () => {
    if (videoRef.current) {
      setEndTime(formatTime(videoRef.current.currentTime));
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Navegador Não Suportado</h2>
          <p className="text-red-300">
            Seu navegador não suporta o processamento de vídeo. 
            Use Chrome, Firefox ou Edge mais recentes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-purple-400">VCUT</span> PRO
          </h1>
          <Button onClick={onLogout} variant="outline" className="text-white border-white/20">
            Sair
          </Button>
        </div>

        {/* Upload Section */}
        {!videoFile && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Carregar Vídeo</h2>
            <div 
              className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center cursor-pointer hover:border-purple-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-white text-lg mb-2">Clique para selecionar um vídeo</p>
              <p className="text-white/60">Formatos suportados: MP4, MOV, AVI</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Video Preview & Controls */}
        {videoFile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Preview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Preview do Vídeo</h3>
              <video
                ref={videoRef}
                src={videoPreview}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: '400px' }}
              />
              <div className="mt-4 text-white/80">
                <p>Duração: {formatTime(videoDuration)}</p>
                <p>Arquivo: {videoFile.name}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Configurações de Corte</h3>
              
              {/* Mode Selection */}
              <div className="mb-6">
                <div className="flex gap-4 mb-4">
                  <Button
                    onClick={() => setProcessingMode('auto')}
                    variant={processingMode === 'auto' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    10 Clips Automáticos
                  </Button>
                  <Button
                    onClick={() => setProcessingMode('custom')}
                    variant={processingMode === 'custom' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    Corte Personalizado
                  </Button>
                </div>
              </div>

              {/* Custom Cut Controls */}
              {processingMode === 'custom' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-white mb-2">Título do Clip:</label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Nome do clip (opcional)"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2">Tempo Inicial (MM:SS):</label>
                      <div className="flex gap-2">
                        <Input
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          placeholder="00:00"
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <Button
                          onClick={setCurrentTimeAsStart}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          Atual
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white mb-2">Tempo Final (MM:SS):</label>
                      <div className="flex gap-2">
                        <Input
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          placeholder="00:30"
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <Button
                          onClick={setCurrentTimeAsEnd}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          Atual
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-white/60 text-sm">
                    💡 Dica: Use os controles do vídeo para navegar e clique "Atual" para definir os tempos
                  </div>
                </div>
              )}

              {/* Process Button */}
              <Button
                onClick={processingMode === 'auto' ? handleAutoCut : handleCustomCut}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isProcessing ? 'Processando...' : 
                 processingMode === 'auto' ? 'Gerar 10 Clips' : 'Fazer Corte'}
              </Button>

              {/* Progress */}
              {isProcessing && (
                <div className="mt-4">
                  <div className="flex justify-between text-white/80 text-sm mb-2">
                    <span>{progress.phase}</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {processedClips.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              {processingMode === 'auto' ? 'Clips Gerados' : 'Clip Processado'} 
              ({processedClips.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedClips.map((clip, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">🎬</div>
                    <p className="text-white font-medium">
                      {processingMode === 'auto' ? `Clip ${index + 1}` : customTitle || 'Clip Personalizado'}
                    </p>
                    <p className="text-white/60 text-sm">
                      {(clip.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => downloadClip(clip, index)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📥 Download
                  </Button>
                </div>
              ))}
            </div>

            {/* Reset Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={() => {
                  setVideoFile(null);
                  setVideoPreview('');
                  setProcessedClips([]);
                  setCustomTitle('');
                  setStartTime('00:00');
                  setEndTime('00:30');
                }}
                variant="outline"
                className="text-white border-white/20"
              >
                Processar Novo Vídeo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
