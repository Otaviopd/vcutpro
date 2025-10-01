"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "../componentes/ui/button";
import { Input } from "../componentes/ui/input";
import { useSmartProcessor, SmartClipData } from "@/hooks/useSmartProcessor";
import { useBackendProcessor, BackendClipData } from "@/hooks/useBackendProcessor";
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
  const [isProcessingClips, setIsProcessingClips] = useState(false);
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Estados para corte manual
  const [customStartTime, setCustomStartTime] = useState<string>('00:00');
  const [customEndTime, setCustomEndTime] = useState<string>('00:30');
  const [customTitle, setCustomTitle] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const smartProcessor = useSmartProcessor();
  const backendProcessor = useBackendProcessor();
  const auth = useAuthHook();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Processar vídeo com IA (usando backend)
  const processVideoWithAI = async () => {
    console.log('processVideoWithAI chamado, videoFile:', videoFile);
    if (!videoFile) {
      console.log('Nenhum arquivo de vídeo selecionado');
      alert('Por favor, selecione um arquivo de vídeo primeiro!');
      return;
    }
    
    try {
      console.log('Iniciando processamento com IA...');
      const backendClips = await backendProcessor.processWithAI(videoFile);
      
      // Converter formato backend para frontend
      const convertedClips: SmartClipData[] = backendClips.map((clip, index) => ({
        id: clip.id,
        title: `Clip ${index + 1}`,
        start: formatSecondsToTime(clip.start_time),
        end: formatSecondsToTime(clip.end_time),
        duration: clip.duration,
        viralPotential: clip.viral_potential || 85,
        description: clip.description,
        impactScore: clip.impact_score || 85,
        keywords: ['viral', 'impacto', 'conteúdo']
      }));
      
      setGeneratedClips(convertedClips);
      setSelectedClips(convertedClips.map(c => c.id));
      setAnalysisComplete(true);
      setViralScore(Math.floor(convertedClips.reduce((acc, clip) => acc + clip.viralPotential, 0) / convertedClips.length));
    } catch (error) {
      console.error('Erro na análise:', error);
      alert('Erro ao processar vídeo. Tente novamente.');
    }
  };

  // Helper para converter segundos para MM:SS
  const formatSecondsToTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      setIsProcessingClips(true);
      setProcessingProgress(0);
      
      const clipsToProcess = generatedClips.filter(clip => selectedClips.includes(clip.id));
      
      for (let i = 0; i < clipsToProcess.length; i++) {
        const clip = clipsToProcess[i];
        setProcessingProgress(Math.floor((i / clipsToProcess.length) * 100));
        
        const blob = await smartProcessor.processSingleClip(videoFile, clip.start, clip.end, clip.title);
        
        // Detectar tipo do arquivo e usar extensão correta
        const fileExtension = blob.type.includes('mp4') ? 'mp4' : 'webm';
        downloadBlob(blob, `${clip.title}_TikTok.${fileExtension}`);
        
        // Pequena pausa entre downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setProcessingProgress(100);
      setTimeout(() => {
        setIsProcessingClips(false);
        setProcessingProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Erro no processamento:', error);
      setIsProcessingClips(false);
      setProcessingProgress(0);
      alert('Erro ao processar clips. Tente novamente.');
    }
  };

  // Processar corte manual (usando backend)
  const processCustomClip = async () => {
    if (!videoFile) return;

    try {
      const title = customTitle || `Corte_${customStartTime}_${customEndTime}`;
      
      // Usar backend para corte manual
      const clip = await backendProcessor.processManualCut(
        videoFile, 
        customStartTime, 
        customEndTime, 
        title
      );
      
      // Download direto do backend
      await backendProcessor.downloadClip('manual_job', clip.id, clip.filename);
      
    } catch (error) {
      console.error('Erro no corte manual:', error);
      setIsProcessingManual(false);
      setProcessingProgress(0);
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

  // Preview de clip
  const previewClip = (clip: SmartClipData) => {
    if (!videoFile) return;
    
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.controls = true;
    video.style.width = '300px';
    video.style.height = '533px'; // 9:16 ratio
    video.style.objectFit = 'cover';
    
    const startSeconds = timeToSeconds(clip.start);
    video.currentTime = startSeconds;
    
    // Criar modal de preview
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); display: flex; align-items: center;
      justify-content: center; z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #1a1a1a; padding: 20px; border-radius: 12px;
      text-align: center; color: white;
    `;
    
    const title = document.createElement('h3');
    title.textContent = `Preview: ${clip.title}`;
    title.style.marginBottom = '10px';
    
    const info = document.createElement('p');
    info.textContent = `${clip.start} - ${clip.end} • Score: ${clip.viralPotential}%`;
    info.style.fontSize = '14px';
    info.style.color = '#888';
    info.style.marginBottom = '15px';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Fechar';
    closeBtn.style.cssText = `
      margin-top: 15px; padding: 8px 16px; background: #333;
      color: white; border: none; border-radius: 6px; cursor: pointer;
    `;
    
    closeBtn.onclick = () => {
      document.body.removeChild(modal);
      video.pause();
    };
    
    content.appendChild(title);
    content.appendChild(info);
    content.appendChild(video);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        video.pause();
      }
    };
  };

  const timeToSeconds = (time: string): number => {
    const [minutes, seconds] = time.split(':').map(Number);
    return minutes * 60 + seconds;
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
              {/* Premium Mode Selection */}
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-all duration-500" />
                <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl rounded-3xl p-10 border border-white/20 shadow-2xl">
                  
                  {/* Header Premium */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-500/30 mb-4">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse" />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-bold text-sm tracking-wider uppercase">
                        Sistema Profissional Ativo
                      </span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                      Escolha Seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">Método</span>
                    </h2>
                    <p className="text-white/60 text-lg font-medium">
                      Tecnologia de ponta para resultados profissionais
                    </p>
                  </div>

                  {/* Premium Mode Cards */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    
                    {/* IA Inteligente Card */}
                    <div 
                      onClick={() => {
                        console.log('Card IA clicado!');
                        console.log('analysisComplete:', analysisComplete);
                        console.log('videoFile:', videoFile);
                        setProcessingMode('smart');
                        if (!analysisComplete) {
                          processVideoWithAI();
                        } else {
                          console.log('Análise já completa, não processando novamente');
                        }
                      }}
                      className={`group/card relative cursor-pointer transition-all duration-500 ${
                        processingMode === 'smart' 
                          ? 'scale-105 shadow-2xl shadow-purple-500/25' 
                          : 'hover:scale-102 hover:shadow-xl'
                      }`}
                    >
                      <div className={`absolute -inset-1 rounded-2xl blur-xl transition-all duration-500 ${
                        processingMode === 'smart'
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 opacity-60'
                          : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover/card:opacity-40'
                      }`} />
                      
                      <div className={`relative h-40 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                        processingMode === 'smart'
                          ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-400/50'
                          : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 group-hover/card:border-purple-400/30'
                      }`}>
                        
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_70%)]" />
                        
                        <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                          {/* Icon */}
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
                            processingMode === 'smart'
                              ? 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30'
                              : 'bg-gradient-to-br from-gray-700 to-gray-800 group-hover/card:from-purple-500/50 group-hover/card:to-blue-500/50'
                          }`}>
                            <span className="text-3xl">🤖</span>
                          </div>
                          
                          {/* Content */}
                          <h3 className={`text-xl font-black mb-2 transition-all duration-300 ${
                            processingMode === 'smart'
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400'
                              : 'text-white group-hover/card:text-purple-300'
                          }`}>
                            IA Inteligente
                          </h3>
                          
                          <p className="text-white/60 text-sm font-medium mb-3 leading-relaxed">
                            Análise automática com algoritmo viral
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full font-medium">
                              10 Clips
                            </div>
                            <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full font-medium">
                              Score IA
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Corte Manual Card */}
                    <div 
                      onClick={() => setProcessingMode('manual')}
                      className={`group/card relative cursor-pointer transition-all duration-500 ${
                        processingMode === 'manual' 
                          ? 'scale-105 shadow-2xl shadow-orange-500/25' 
                          : 'hover:scale-102 hover:shadow-xl'
                      }`}
                    >
                      <div className={`absolute -inset-1 rounded-2xl blur-xl transition-all duration-500 ${
                        processingMode === 'manual'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 opacity-60'
                          : 'bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover/card:opacity-40'
                      }`} />
                      
                      <div className={`relative h-40 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                        processingMode === 'manual'
                          ? 'bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-400/50'
                          : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 group-hover/card:border-orange-400/30'
                      }`}>
                        
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.1),transparent_70%)]" />
                        
                        <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                          {/* Icon */}
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
                            processingMode === 'manual'
                              ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30'
                              : 'bg-gradient-to-br from-gray-700 to-gray-800 group-hover/card:from-orange-500/50 group-hover/card:to-red-500/50'
                          }`}>
                            <span className="text-3xl">✂️</span>
                          </div>
                          
                          {/* Content */}
                          <h3 className={`text-xl font-black mb-2 transition-all duration-300 ${
                            processingMode === 'manual'
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400'
                              : 'text-white group-hover/card:text-orange-300'
                          }`}>
                            Corte Manual
                          </h3>
                          
                          <p className="text-white/60 text-sm font-medium mb-3 leading-relaxed">
                            Controle total com minutagem específica
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <div className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full font-medium">
                              Precisão
                            </div>
                            <div className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full font-medium">
                              Customizado
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Info Premium */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-white/80 font-medium text-sm">
                          {videoFile.name}
                        </span>
                      </div>
                      <div className="w-px h-4 bg-white/20" />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⏱️</span>
                        <span className="text-white/80 font-bold text-sm">
                          {formatTime(videoDuration)}
                        </span>
                      </div>
                    </div>
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
                              disabled={selectedClips.length === 0 || backendProcessor.isProcessing}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 relative overflow-hidden"
                            >
                              {backendProcessor.isProcessing ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>{backendProcessor.stage} {backendProcessor.progress}%</span>
                                </div>
                              ) : (
                                <span>📥 Baixar {selectedClips.length} Clips</span>
                              )}
                              
                              {backendProcessor.isProcessing && (
                                <div 
                                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-300"
                                  style={{ width: `${backendProcessor.progress}%` }}
                                />
                              )}
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
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                      <span>🎯 Score: {clip.impactScore}</span>
                                      <span>•</span>
                                      <span>📱 9:16</span>
                                      <span>•</span>
                                      <span>🔥 MP4/WebM</span>
                                    </div>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        previewClip(clip);
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-xs border-white/20 text-white/60 hover:bg-white/10"
                                    >
                                      👁️ Preview
                                    </Button>
                                  </div>
                                  
                                  {/* Viral Factors */}
                                  <div className="flex flex-wrap gap-1">
                                    {clip.keywords.slice(0, 2).map((keyword, i) => (
                                      <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                        {keyword}
                                      </span>
                                    ))}
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

              {/* Premium Manual Mode */}
              {processingMode === 'manual' && (
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-all duration-500" />
                  <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl rounded-3xl p-10 border border-orange-500/20 shadow-2xl">
                    
                    {/* Header Premium */}
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30 mb-4">
                        <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 font-bold text-sm tracking-wider uppercase">
                          Controle Profissional
                        </span>
                      </div>
                      <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-400">Corte</span> Personalizado
                      </h2>
                      <p className="text-white/60 text-lg font-medium">
                        Precisão cirúrgica para resultados únicos
                      </p>
                    </div>

                    {/* Premium Input Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div className="group/input">
                        <label className="flex items-center gap-2 text-white/80 text-sm font-bold mb-3 tracking-wide uppercase">
                          <span className="text-lg">🎬</span>
                          Tempo Inicial
                        </label>
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-all duration-300" />
                          <Input
                            type="text"
                            value={customStartTime}
                            onChange={(e) => setCustomStartTime(e.target.value)}
                            placeholder="00:00"
                            className="relative h-14 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-2 border-white/10 text-white text-lg font-mono text-center rounded-xl focus:border-orange-400/50 focus:bg-orange-500/5 transition-all duration-300"
                          />
                          <div className="absolute inset-y-0 right-4 flex items-center">
                            <span className="text-orange-400/60 text-sm font-medium">MM:SS</span>
                          </div>
                        </div>
                      </div>

                      <div className="group/input">
                        <label className="flex items-center gap-2 text-white/80 text-sm font-bold mb-3 tracking-wide uppercase">
                          <span className="text-lg">🏁</span>
                          Tempo Final
                        </label>
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-all duration-300" />
                          <Input
                            type="text"
                            value={customEndTime}
                            onChange={(e) => setCustomEndTime(e.target.value)}
                            placeholder="00:30"
                            className="relative h-14 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-2 border-white/10 text-white text-lg font-mono text-center rounded-xl focus:border-red-400/50 focus:bg-red-500/5 transition-all duration-300"
                          />
                          <div className="absolute inset-y-0 right-4 flex items-center">
                            <span className="text-red-400/60 text-sm font-medium">MM:SS</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Premium Title Input */}
                    <div className="mb-8 group/input">
                      <label className="flex items-center gap-2 text-white/80 text-sm font-bold mb-3 tracking-wide uppercase">
                        <span className="text-lg">🏷️</span>
                        Título do Clip
                        <span className="text-white/40 text-xs normal-case">(opcional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-all duration-300" />
                        <Input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Meu Clip Profissional"
                          className="relative h-14 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-2 border-white/10 text-white text-lg rounded-xl focus:border-purple-400/50 focus:bg-purple-500/5 transition-all duration-300 px-6"
                        />
                      </div>
                    </div>

                    {/* Duration Calculator */}
                    <div className="mb-8 p-6 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <span className="text-white text-lg">⏱️</span>
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm">Duração Calculada</h4>
                            <p className="text-white/60 text-xs">Tempo total do clip</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                            {(() => {
                              const start = timeToSeconds(customStartTime);
                              const end = timeToSeconds(customEndTime);
                              const duration = Math.max(0, end - start);
                              return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
                            })()}
                          </div>
                          <p className="text-white/50 text-xs">segundos</p>
                        </div>
                      </div>
                    </div>

                    {/* Premium Action Button */}
                    <div className="relative group/button">
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-75 group-hover/button:opacity-100 transition-all duration-300" />
                      <Button
                        onClick={processCustomClip}
                        disabled={backendProcessor.isProcessing}
                        className="relative w-full h-16 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black text-lg rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100 overflow-hidden"
                      >
                        {backendProcessor.isProcessing ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{backendProcessor.stage} {backendProcessor.progress}%</span>
                          </div>
                        ) : (
                          <span className="flex items-center justify-center gap-3">
                            <span className="text-2xl">✂️</span>
                            <span>Processar Corte Profissional</span>
                            <span className="text-2xl">🎯</span>
                          </span>
                        )}
                        
                        {backendProcessor.isProcessing && (
                          <div 
                            className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 transition-all duration-300"
                            style={{ width: `${backendProcessor.progress}%` }}
                          />
                        )}
                      </Button>
                    </div>

                    {/* Premium Features Info */}
                    <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-lg mb-1">📱</div>
                        <div className="text-white/80 text-xs font-medium">Vertical 9:16</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-lg mb-1">🔥</div>
                        <div className="text-white/80 text-xs font-medium">Qualidade Original</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-lg mb-1">⚡</div>
                        <div className="text-white/80 text-xs font-medium">MP4/WebM Auto</div>
                      </div>
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
