"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "../componentes/ui/button";
import { Input } from "../componentes/ui/input";
import { useSmartProcessor, downloadBlob, type SmartClipData } from "../hooks/useSmartProcessor";
import { useAuthHook } from "../hooks/useAuth";
import LoginScreen from "../componentes/LoginScreen";

export default function VCutPlatform() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [viralScore, setViralScore] = useState(0);
  const [generatedClips, setGeneratedClips] = useState<SmartClipData[]>([]);
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [processingMode, setProcessingMode] = useState<'smart' | 'manual'>('smart');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  
  // Estados para corte personalizado
  const [customStartTime, setCustomStartTime] = useState<string>('00:00');
  const [customEndTime, setCustomEndTime] = useState<string>('00:30');
  const [customTitle, setCustomTitle] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const smartProcessor = useSmartProcessor();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Processar vídeo com IA
  const processVideoWithAI = async () => {
    if (!videoFile) return;
    
    try {
      const clips = await smartProcessor.processVideoSmart(videoFile);
      setGeneratedClips(clips);
      setSelectedClips(clips.map(c => c.id));
      setAnalysisComplete(true);
      setViralScore(Math.floor(clips.reduce((acc, clip) => acc + clip.viralPotential, 0) / clips.length));
    } catch (error) {
      console.error('Erro no processamento:', error);
      alert('Erro ao processar vídeo. Tente novamente.');
    }
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setAnalysisComplete(false);
      setGeneratedClips([]);
      setSelectedClips([]);
      
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        
        if (processingMode === 'smart') {
          processVideoWithAI();
        } else if (processingMode === 'manual') {
          // Processar vídeo com corte manual
          // ...
        }
      };
      video.src = URL.createObjectURL(file);
    }
  };

{{ ... }}
  const processSelectedClips = async () => {
    if (!videoFile || selectedClips.length === 0) return;

    try {
      const clipsToProcess = generatedClips.filter(clip => selectedClips.includes(clip.id));

      for (const clip of clipsToProcess) {
        const blob = await smartProcessor.processSingleClip(videoFile, clip.start, clip.end, clip.title);
        downloadBlob(blob, `${clip.title}_vertical.webm`);
      }
      
      alert(`${clipsToProcess.length} clips processados e baixados!`);
    } catch (error) {
      console.error('Erro no processamento:', error);
      alert('Erro ao processar clips. Tente novamente.');
    }
  };

  // Processar corte manual
  const processCustomClip = async () => {
    if (!videoFile) return;

    try {
      const title = customTitle || `Corte_${customStartTime}_${customEndTime}`;
      const blob = await smartProcessor.processSingleClip(videoFile, customStartTime, customEndTime, title);
      
      downloadBlob(blob, `${title}_vertical.webm`);
      
      alert('Corte manual processado e baixado!');
    } catch (error) {
      console.error('Erro no corte manual:', error);
      alert('Erro ao processar corte. Tente novamente.');
    }
  };


  const toggleClipSelection = (clipId: string) => {
    setSelectedClips(prev => 
      prev.includes(clipId) 
        ? prev.filter(id => id !== clipId)
        : [...prev, clipId]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isMounted) {
    return null;
  }

  if (!auth.user) {
    return <LoginScreen onLogin={auth.login} isLoading={auth.isLoading} />;
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
          onClick={auth.logout}
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
                    #1 Plataforma de IA para Vídeos
                  </span>
                </div>
                
                <h2 className="text-6xl font-black leading-tight tracking-[-0.02em] text-white mb-6">
                  Corte seus vídeos para<br />
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                    Instagram
                  </span>
                  <span className="text-white">, </span>
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    TikTok
                  </span>
                  <br />
                  <span className="text-white">e </span>
                  <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                    YouTube
                  </span>
                </h2>
                
                <p className="text-white/50 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                  Transforme seus vídeos longos em clips virais otimizados com tecnologia de IA avançada
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
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Bottom Features Premium */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-4xl w-full">
                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">✂️</span>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">Cortes Precisos</h4>
                  <p className="text-white/50 text-sm font-medium">IA detecta os melhores momentos</p>
                </div>
                
                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📱</span>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">Formato Vertical</h4>
                  <p className="text-white/50 text-sm font-medium">Otimizado para Stories e Reels</p>
                </div>
                
                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">WebCodecs Ultra-Rápido</h4>
                  <p className="text-white/50 text-sm font-medium">10x mais rápido que FFmpeg</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Mode Selection */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                  <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">Escolha o Modo de Processamento</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Button
                      onClick={() => setProcessingMode('intelligent')}
                      variant={processingMode === 'intelligent' ? 'default' : 'outline'}
                      className={`h-20 flex flex-col gap-2 ${processingMode === 'intelligent' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'border-white/20 text-white/80'}`}
                    >
                      <span className="text-2xl">🤖</span>
                      <span className="font-bold">IA Inteligente</span>
                      <span className="text-xs opacity-80">Whisper + NLP</span>
                    </Button>
                    <Button
                      onClick={() => setProcessingMode('auto')}
                      variant={processingMode === 'auto' ? 'default' : 'outline'}
                      className={`h-20 flex flex-col gap-2 ${processingMode === 'auto' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'border-white/20 text-white/80'}`}
                    >
                      <span className="text-2xl">⚡</span>
                      <span className="font-bold">Clips Automáticos</span>
                      <span className="text-xs opacity-80">10 clips aleatórios</span>
                    </Button>
                    <Button
                      onClick={() => setProcessingMode('custom')}
                      variant={processingMode === 'custom' ? 'default' : 'outline'}
                      className={`h-20 flex flex-col gap-2 ${processingMode === 'custom' ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'border-white/20 text-white/80'}`}
                    >
                      <span className="text-2xl">✂️</span>
                      <span className="font-bold">Corte Manual</span>
                      <span className="text-xs opacity-80">Minutagem específica</span>
                    </Button>
                  </div>

                  <div className="text-center text-white/60 text-sm">
                    Vídeo: {videoFile.name} • Duração: {formatTime(videoDuration)}
                  </div>
                </div>
              </div>

              {/* Renderizar componente baseado no modo */}
              {processingMode === 'intelligent' ? (
                <IntelligentProcessor 
                  videoFile={videoFile} 
                  onComplete={(clips) => {
                    console.log('Clips inteligentes gerados:', clips);
                  }} 
                />
              ) : (
                <>
              {/* Video Analysis */}
              {!analysisComplete ? (
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                    <div className="flex items-center justify-center space-y-6 flex-col">
                      <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <div className="text-center">
                        <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-2">Analisando seu vídeo...</h3>
                        <p className="text-white/60">Nossa IA está identificando os melhores momentos para clips virais</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Viral Score */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
                    <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white tracking-[-0.02em]">Análise Completa</h3>
                        <div className="text-right">
                          <div className={`text-3xl font-black mb-1 ${
                            viralScore >= 80 ? 'text-green-400' : 
                            viralScore >= 70 ? 'text-orange-400' : 'text-red-400'
                          }`}>
                            {viralScore}%
                          </div>
                          <p className="text-white/60 text-sm font-medium tracking-[0.02em] uppercase">Potencial Viral</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-white font-medium">Engajamento</span>
                          <span className="text-white font-bold">{Math.floor(viralScore * 0.9)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-white font-medium">Retenção</span>
                          <span className="text-white font-bold">{Math.floor(viralScore * 0.85)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-white font-medium">Shareability</span>
                          <span className="text-white font-bold">{Math.floor(viralScore * 0.95)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generated Clips */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
                    <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white tracking-[-0.02em]">Clips Gerados pela IA</h3>
                        <div className="text-sm text-white/60">
                          {selectedClips.length} de {generatedClips.length} selecionados
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 pt-4">
                        {generatedClips.map((clip) => (
                          <div
                            key={clip.id}
                            className={`p-6 rounded-xl border cursor-pointer transition-all ${
                              selectedClips.includes(clip.id)
                                ? 'bg-white/10 border-white/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/8'
                            }`}
                            onClick={() => toggleClipSelection(clip.id)}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-white font-bold">{clip.title}</h4>
                              <div className={`text-sm font-bold ${
                                clip.viralPotential >= 80 ? 'text-green-400' : 
                                clip.viralPotential >= 70 ? 'text-orange-400' : 'text-red-400'
                              }`}>
                                {clip.viralPotential}%
                              </div>
                            </div>
                            <p className="text-white/60 text-sm mb-3">{clip.description}</p>
                            <div className="text-white/50 text-xs">
                              {clip.start} - {clip.end}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 flex gap-4">
                        <Button
                          onClick={() => setSelectedClips(generatedClips.map(c => c.id))}
                          variant="outline"
                          className="flex-1 border-white/20 text-white/80"
                        >
                          Selecionar Todos
                        </Button>
                        <Button
                          onClick={() => setSelectedClips([])}
                          variant="outline"
                          className="flex-1 border-white/20 text-white/80"
                        >
                          Limpar Seleção
                        </Button>
                        <Button
                          onClick={processSelectedClips}
                          disabled={selectedClips.length === 0 || ffmpeg.isProcessing}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          {ffmpeg.isProcessing ? 'Processando...' : `Processar ${selectedClips.length} Clips`}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Processing Progress */}
                  {ffmpeg.isProcessing && (
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                      <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                        <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">
                          Processamento WebCodecs Ultra-Rápido
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white font-medium">
                              {ffmpeg.progress.phase || 'Preparando...'}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${ffmpeg.progress.progress}%` }}
                            />
                          </div>
                          <div className="text-center text-white/60 text-sm">
                            Processando com WebCodecs - 10x mais rápido que FFmpeg!
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Downloaded Clips */}
                  {downloadedClips.length > 0 && (
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 rounded-2xl blur-xl" />
                      <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-black text-white tracking-[-0.02em]">Conversão Opcional para MP4</h3>
                          <div className="text-sm text-white/60">
                            {downloadedClips.length} clips disponíveis
                          </div>
                        </div>
                        
                        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <span className="text-white font-bold">Compatibilidade WebM</span>
                          </div>
                          <p className="text-white/70 text-sm">
                            ✅ VLC Player, Chrome, Firefox, Edge<br/>
                            ✅ Dispositivos Android e iOS modernos<br/>
                            ⚠️ Windows Media Player (requer conversão MP4)
                          </p>
                        </div>

                        <div className="grid gap-3 mb-6">
                          {downloadedClips.map((clip) => (
                            <div key={clip.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                              <div>
                                <div className="text-white font-medium">{clip.title}</div>
                                <div className="text-white/50 text-sm">WebM baixado • {(clip.webmBlob.size / 1024 / 1024).toFixed(1)}MB</div>
                              </div>
                              <Button
                                onClick={() => convertClipsToMP4([clip.id])}
                                disabled={isConverting}
                                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold px-4 py-2 rounded-lg text-sm"
                              >
                                {isConverting ? 'Convertendo...' : 'Converter MP4'}
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={() => convertClipsToMP4(downloadedClips.map(c => c.id))}
                          disabled={isConverting || downloadedClips.length === 0}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold px-6 py-3 rounded-xl"
                        >
                          {isConverting ? 'Convertendo todos...' : `Converter Todos para MP4 (${downloadedClips.length})`}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-2xl blur-xl" />
                    <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                      <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-4">Status do Sistema</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-white font-medium">Processamento Principal</span>
                          <span className="font-bold text-green-400">
                            WebCodecs Ultra-Rápido
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-white font-medium">Velocidade</span>
                          <span className="font-bold text-green-400">
                            10x Mais Rápido
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-white font-medium">Formato Principal</span>
                          <span className="font-bold text-green-400">
                            WebM (Nativo)
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-white font-medium">Tecnologia</span>
                          <span className="font-bold text-blue-400">
                            WebCodecs API
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
                )}
              </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
