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
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      
      {/* Header com informações do usuário */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
        <div className="text-right">
          <p className="text-white/80 text-sm">Usuário Premium</p>
          <p className="text-white/60 text-xs">VCUT Pro Ativo</p>
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          className="border-white/20 text-white/80 hover:bg-white/5 text-sm px-3 py-1"
        >
          Sair
        </Button>
      </div>

      {/* Premium Logo */}
      <div className="fixed left-8 top-8 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-white via-gray-200 to-gray-400 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
              <span className="text-black font-black text-xl tracking-tighter">V</span>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-2xl blur-sm -z-10"></div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-2xl tracking-[-0.02em] bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                VCUT
              </span>
              <span className="text-white/60 font-light text-2xl tracking-[-0.02em]">Pro</span>
            </div>
            <div className="text-white/40 text-xs font-medium tracking-[0.1em] uppercase -mt-1">
              AI POWERED STUDIO
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-8 pt-24">
        <div className="max-w-7xl mx-auto">

        {!videoFile ? (
          /* Upload Section Premium */
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/60 text-sm font-semibold tracking-[0.05em] uppercase">
                  FFmpeg Ultra-Rápido Ativo
                </span>
              </div>
              
              <h2 className="text-6xl font-black leading-tight tracking-[-0.02em] text-white mb-6">
                Faça Upload do<br />Seu Vídeo
              </h2>
              
              <p className="text-white/50 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Transforme seus vídeos longos em clips virais otimizados para Instagram, TikTok e YouTube
              </p>
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="h-16 px-12 bg-gradient-to-r from-white via-gray-100 to-white text-black hover:from-gray-100 hover:to-gray-200 font-bold text-lg rounded-2xl tracking-[-0.01em] shadow-2xl transition-all duration-300 hover:shadow-white/20 hover:scale-[1.02]"
            >
              Escolher Vídeo
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Bottom Features Premium */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-4xl w-full">
              <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">FFmpeg Ultra-Rápido</h4>
                <p className="text-white/50 text-sm font-medium">Cortes diretos sem perda de qualidade</p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">✂️</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">Corte Personalizado</h4>
                <p className="text-white/50 text-sm font-medium">Defina tempo inicial e final exatos</p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">Múltiplos Cortes</h4>
                <p className="text-white/50 text-sm font-medium">Gere até 10 clips com um clique</p>
              </div>
            </div>
          </div>
        ) : (

          /* Dashboard Premium */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                  <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">Preview do Vídeo</h3>
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    controls
                    className="w-full rounded-xl shadow-2xl"
                  />
                  <div className="mt-4 text-white/80">
                    <p>Duração: {formatTime(videoDuration)}</p>
                    <p>Arquivo: {videoFile.name}</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                    <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">
                      Processamento FFmpeg Direto
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">
                          {progress.phase || 'Preparando...'}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      <div className="text-center text-white/60 text-sm">
                        Processando com FFmpeg - Qualidade Original Preservada!
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                  <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">Configurações de Corte</h3>
              
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
