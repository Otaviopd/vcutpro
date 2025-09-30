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
  
  // Estados para corte manual
  const [customStartTime, setCustomStartTime] = useState<string>('00:00');
  const [customEndTime, setCustomEndTime] = useState<string>('00:30');
  const [customTitle, setCustomTitle] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const smartProcessor = useSmartProcessor();
  const auth = useAuthHook();

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
        }
      };
      video.src = URL.createObjectURL(file);
    }
  };

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
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Header */}
      <div className="relative z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">V</span>
            </div>
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
            /* Upload Section */
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/60 text-sm font-semibold tracking-[0.05em] uppercase">
                    Sistema Inteligente + Qualidade Original
                  </span>
                </div>
                
                <h2 className="text-6xl font-black leading-tight tracking-[-0.02em] text-white mb-6">
                  Cortes inteligentes para<br />
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                    TikTok
                  </span>
                  <span className="text-white"> e </span>
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    Reels
                  </span>
                </h2>
                
                <p className="text-white/50 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                  IA analisa seu vídeo e gera clips virais em formato vertical com qualidade original
                </p>
              </div>

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-16 px-12 bg-gradient-to-r from-white via-gray-100 to-white text-black hover:from-gray-100 hover:to-gray-200 font-bold text-lg rounded-2xl tracking-[-0.01em] shadow-2xl transition-all duration-300 hover:shadow-white/20 hover:scale-[1.02]"
              >
                📤 Enviar Vídeo
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Features Grid */}
              <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">🤖</span>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">IA Inteligente</h4>
                  <p className="text-white/50 text-sm font-medium">Análise automática de conteúdo</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📱</span>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">Formato Vertical</h4>
                  <p className="text-white/50 text-sm font-medium">9:16 otimizado para redes</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">Qualidade Original</h4>
                  <p className="text-white/50 text-sm font-medium">Sem perda de qualidade</p>
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
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button
                      onClick={() => setProcessingMode('smart')}
                      variant={processingMode === 'smart' ? 'default' : 'outline'}
                      className={`h-20 flex flex-col gap-2 ${processingMode === 'smart' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'border-white/20 text-white/80'}`}
                    >
                      <span className="text-2xl">🤖</span>
                      <span className="font-bold">IA Inteligente</span>
                      <span className="text-xs opacity-80">10 clips automáticos</span>
                    </Button>
                    <Button
                      onClick={() => setProcessingMode('manual')}
                      variant={processingMode === 'manual' ? 'default' : 'outline'}
                      className={`h-20 flex flex-col gap-2 ${processingMode === 'manual' ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'border-white/20 text-white/80'}`}
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

              {/* Smart Mode */}
              {processingMode === 'smart' && (
                <>
                  {smartProcessor.isProcessing ? (
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
                      <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                        <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">
                          🤖 IA Processando Vídeo
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-white font-medium">
                              {smartProcessor.progress.phase}
                            </span>
                          </div>
                          
                          <div className="w-full bg-white/10 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${smartProcessor.progress.progress}%` }}
                            />
                          </div>
                          
                          <div className="text-center text-white/60 text-sm">
                            <div className="mb-2">Sistema Inteligente Ativo:</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>✅ Análise de Padrões</div>
                              <div>✅ Detecção de Momentos</div>
                              <div>✅ Otimização Vertical</div>
                              <div>✅ Qualidade Original</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : analysisComplete && generatedClips.length > 0 ? (
                    <>
                      {/* Viral Score */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
                        <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-white tracking-[-0.02em]">Análise IA Completa</h3>
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
                        </div>
                      </div>

                      {/* Generated Clips */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
                        <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-white tracking-[-0.02em]">
                              🎯 Clips Inteligentes ({generatedClips.length})
                            </h3>
                            <Button
                              onClick={processSelectedClips}
                              disabled={selectedClips.length === 0}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                            >
                              📥 Baixar {selectedClips.length} Clips
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            {generatedClips.map((clip) => (
                              <div
                                key={clip.id}
                                className={`p-6 rounded-xl border cursor-pointer transition-all ${
                                  selectedClips.includes(clip.id)
                                    ? 'bg-white/10 border-white/30 ring-2 ring-purple-500/50'
                                    : 'bg-white/5 border-white/10 hover:bg-white/8'
                                }`}
                                onClick={() => toggleClipSelection(clip.id)}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-white font-bold">{clip.title}</h4>
                                  <div className="flex items-center gap-2">
                                    <div className={`text-sm font-bold ${
                                      clip.viralPotential >= 80 ? 'text-green-400' : 
                                      clip.viralPotential >= 70 ? 'text-orange-400' : 'text-red-400'
                                    }`}>
                                      {clip.viralPotential}%
                                    </div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                  </div>
                                </div>
                                
                                <p className="text-white/60 text-sm mb-3 line-clamp-2">
                                  {clip.description}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-white/50">
                                    {clip.start} - {clip.end}
                                  </span>
                                  <span className="text-purple-400 font-medium">
                                    {Math.floor(clip.duration)}s
                                  </span>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-white/10">
                                  <div className="flex items-center gap-2 text-xs text-white/50">
                                    <span>🎯 Score: {clip.impactScore}</span>
                                    <span>•</span>
                                    <span>📱 Vertical 9:16</span>
                                    <span>•</span>
                                    <span>🔥 Qualidade Original</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 flex gap-4">
                            <Button
                              onClick={() => setSelectedClips(generatedClips.map(c => c.id))}
                              variant="outline"
                              className="flex-1 border-white/20 text-white/80 hover:bg-white/5"
                            >
                              Selecionar Todos
                            </Button>
                            <Button
                              onClick={() => setSelectedClips([])}
                              variant="outline"
                              className="flex-1 border-white/20 text-white/80 hover:bg-white/5"
                            >
                              Limpar Seleção
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </>
              )}

              {/* Manual Mode */}
              {processingMode === 'manual' && (
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                    <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">
                      ✂️ Corte Manual Personalizado
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">
                          Tempo Inicial (MM:SS)
                        </label>
                        <Input
                          type="text"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          placeholder="00:00"
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm font-medium mb-2">
                          Tempo Final (MM:SS)
                        </label>
                        <Input
                          type="text"
                          value={customEndTime}
                          onChange={(e) => setCustomEndTime(e.target.value)}
                          placeholder="00:30"
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-white/60 text-sm font-medium mb-2">
                        Título do Clip (opcional)
                      </label>
                      <Input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Meu Clip Personalizado"
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    <Button
                      onClick={processCustomClip}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    >
                      ✂️ Processar Corte Manual
                    </Button>

                    <div className="mt-4 text-center text-white/50 text-xs">
                      💡 Formato vertical 9:16 com qualidade original mantida
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
