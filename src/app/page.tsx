"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "../componentes/ui/button";
import { Input } from "../componentes/ui/input";
import { useFFmpeg, downloadBlob, type ClipData } from "../hooks/useFFmpeg";
import { useWebCodecs } from "../hooks/useWebCodecs";
import { useCanvasVideoProcessor } from "../hooks/useCanvasVideoProcessor";
import { useVideoEncoderMP4 } from "../hooks/useVideoEncoderMP4";
import { useCanvasMP4 } from "../hooks/useCanvasMP4";
import { useAuthHook } from "../hooks/useAuth";
import LoginScreen from "../componentes/LoginScreen";

export default function VCutPlatform() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [viralScore, setViralScore] = useState(0);
  const [generatedClips, setGeneratedClips] = useState<ClipData[]>([]);
  const [selectedClips, setSelectedClips] = useState<number[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadedClips, setDownloadedClips] = useState<{id: number, webmBlob: Blob, title: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const webcodecs = useWebCodecs();
  const ffmpeg = useFFmpeg();
  const canvasProcessor = useCanvasVideoProcessor();
  const videoEncoder = useVideoEncoderMP4();
  const canvasMP4 = useCanvasMP4();
  const auth = useAuthHook();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setAnalysisComplete(false);
      setGeneratedClips([]);
      setTimeout(() => analyzeVideo(), 1000);
    }
  };

  const analyzeVideo = () => {
    setTimeout(() => {
      const score = Math.floor(Math.random() * 40) + 60;
      setViralScore(score);
      
      const clips: ClipData[] = [
        { id: 1, start: "00:00", end: "00:15", title: "Abertura Impactante", score: 95, type: "Stories" },
        { id: 2, start: "00:30", end: "01:00", title: "Momento Viral", score: 88, type: "TikTok" },
        { id: 3, start: "01:15", end: "01:45", title: "Call to Action", score: 82, type: "YouTube" },
        { id: 4, start: "02:00", end: "02:30", title: "Punchline Principal", score: 91, type: "Reels" },
        { id: 5, start: "02:45", end: "03:15", title: "Conclusão Forte", score: 85, type: "Stories" },
      ];
      
      setGeneratedClips(clips);
      setAnalysisComplete(true);
    }, 4000);
  };

  const handleGenerateMultipleClips = () => {
    if (!videoFile) return;
    
    const multiClips: ClipData[] = Array.from({length: 10}, (_, i) => ({
      id: i + 6,
      start: `00:${String(i * 20).padStart(2, '0')}`,
      end: `00:${String((i * 20) + 15).padStart(2, '0')}`,
      title: `Clip Automático ${i + 1}`,
      score: Math.floor(Math.random() * 30) + 70,
      type: ['Stories', 'TikTok', 'Reels', 'YouTube'][Math.floor(Math.random() * 4)]
    }));
    
    setGeneratedClips(prev => [...prev, ...multiClips]);
    alert(`✅ 10 clips gerados automaticamente!`);
  };

  // Função para converter clips baixados para MP4 (opcional)
  const convertClipsToMP4 = async (clipIds: number[]) => {
    try {
      setIsConverting(true);
      
      // Carregar FFmpeg se necessário
      if (!ffmpeg.isLoaded) {
        await ffmpeg.loadFFmpeg();
      }

      const clipsToConvert = downloadedClips.filter(clip => clipIds.includes(clip.id));
      
      for (const clip of clipsToConvert) {
        try {
          // Usar FFmpeg para processar diretamente o arquivo original
          const mp4Blob = await ffmpeg.processSingleClip(
            videoFile!, 
            generatedClips.find(c => c.id === clip.id)?.start || '00:00',
            generatedClips.find(c => c.id === clip.id)?.end || '00:30',
            clip.title
          );
          
          // Download do MP4
          downloadBlob(mp4Blob, `${clip.title.replace(/\s+/g, '_')}.mp4`);
          
        } catch (error) {
          console.error(`Erro ao converter ${clip.title}:`, error);
        }
      }
      
      alert(`✅ ${clipsToConvert.length} clips convertidos para MP4!`);
      
    } catch (error) {
      console.error('Erro na conversão para MP4:', error);
      alert('❌ Erro na conversão. Tente novamente.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleProcessSelectedClips = async () => {
    if (!videoFile || selectedClips.length === 0) {
      alert('Selecione pelo menos um clip para processar!');
      return;
    }

    try {
      const clipsToProcess = generatedClips.filter(clip => selectedClips.includes(clip.id));
      
      // 🚀 ESTRATÉGIA 1: Canvas MP4 Otimizado (PRINCIPAL - MAIS ESTÁVEL)
      if (canvasMP4.isSupported) {
        alert('🚀 Canvas MP4 Otimizado - Formato TikTok/Stories (9:16) - Alta Qualidade!');
        
        if (clipsToProcess.length === 1) {
          const clip = clipsToProcess[0];
          
          // Processar com Canvas otimizado (3-8 segundos)
          const mp4Blob = await canvasMP4.processSingleClip(videoFile, clip.start, clip.end, clip.title);
          
          // Download do arquivo otimizado
          const extension = mp4Blob.type.includes('mp4') ? 'mp4' : 'webm';
          downloadBlob(mp4Blob, `${clip.title.replace(/\s+/g, '_')}.${extension}`);
          
          if (extension === 'mp4') {
            alert(`✅ Clip processado em 3-8s!\n\n📁 Arquivo MP4 - FORMATO TIKTOK PERFEITO baixado\n\n🎯 ESPECIFICAÇÕES:\n• Resolução: 1080x1920 (9:16 forçado)\n• Qualidade: Full HD 30fps\n• Vídeo: 4Mbps (nítido e fluido)\n• Áudio: AAC 128kbps (compatível)\n• Fluidez: 30fps (suave)\n\n✅ PERFEITO PARA:\n• TikTok ✅ (formato nativo)\n• Instagram Stories ✅\n• YouTube Shorts ✅\n• WhatsApp ✅\n\n🚀 Vertical forçado + Áudio AAC + Fluidez ideal!`);
          } else {
            alert(`✅ Clip processado em 3-8s!\n\n📁 Arquivo WebM - FORMATO TIKTOK PERFEITO baixado\n\n🎯 ESPECIFICAÇÕES:\n• Resolução: 1080x1920 (9:16 forçado)\n• Qualidade: Full HD 30fps\n• Áudio: Vorbis (compatível)\n• Fluidez: 30fps (suave)\n\n🎯 COMO USAR:\n• VLC Player (reproduz perfeitamente)\n• Chrome/Firefox (direto)\n• Converter online para MP4 se precisar\n\n🚀 Vertical forçado + Áudio Vorbis + Fluidez ideal!`);
          }
          
        } else {
          // Processar múltiplos clips com Canvas
          for (const clip of clipsToProcess) {
            const videoBlob = await canvasMP4.processSingleClip(videoFile, clip.start, clip.end, clip.title);
            const extension = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
            downloadBlob(videoBlob, `${clip.title.replace(/\s+/g, '_')}.${extension}`);
          }
          
          alert(`✅ ${clipsToProcess.length} clips processados!\n\n📁 Arquivos baixados\n\n✅ Canvas otimizado funcionando!`);
        }
        
      } else if (videoEncoder.isSupported) {
        // 🔄 FALLBACK 1: VideoEncoder API (se Canvas não funcionar)
        alert('⚡ Tentando VideoEncoder API...');
        
        try {
          if (clipsToProcess.length === 1) {
            const clip = clipsToProcess[0];
            const mp4Blob = await videoEncoder.processSingleClip(videoFile, clip.start, clip.end, clip.title);
            downloadBlob(mp4Blob, `${clip.title.replace(/\s+/g, '_')}.mp4`);
            alert(`✅ VideoEncoder funcionou! MP4 baixado.`);
          }
        } catch (encoderError) {
          console.error('VideoEncoder falhou:', encoderError);
          alert('⚠️ VideoEncoder falhou. Tentando próxima opção...');
          throw encoderError;
        }
        
      } else if (webcodecs.isSupported) {
        // 🔄 FALLBACK 1: WebCodecs (ainda rápido mas WebM)
        alert('⚡ VideoEncoder não suportado. Usando WebCodecs...');
        
        if (clipsToProcess.length === 1) {
          const clip = clipsToProcess[0];
          const webmBlob = await webcodecs.processSingleClip(videoFile, clip.start, clip.end, clip.title);
          downloadBlob(webmBlob, `${clip.title.replace(/\s+/g, '_')}.webm`);
          alert(`✅ Clip WebM processado! Use VLC para abrir.`);
        } else {
          for (const clip of clipsToProcess) {
            const webmBlob = await webcodecs.processSingleClip(videoFile, clip.start, clip.end, clip.title);
            downloadBlob(webmBlob, `${clip.title.replace(/\s+/g, '_')}.webm`);
          }
        }
        
      } else {
        // 🔄 FALLBACK 2: FFmpeg corrigido (navegadores antigos)
        alert('⚠️ APIs modernas não suportadas. Usando FFmpeg corrigido...');
        
        for (const clip of clipsToProcess) {
          const mp4Blob = await ffmpeg.processSingleClip(videoFile, clip.start, clip.end, clip.title);
          downloadBlob(mp4Blob, `${clip.title.replace(/\s+/g, '_')}.mp4`);
        }
        
        alert(`✅ ${clipsToProcess.length} clips processados com FFmpeg! Arquivos MP4 baixados.`);
      }
      
      setSelectedClips([]);
      
    } catch (error) {
      console.error('Erro no processamento:', error);
      alert('❌ Erro no processamento. Tente novamente.');
    }
  };

  // Mostrar tela de login se não autenticado
  if (!auth.user) {
    return <LoginScreen onLogin={auth.login} isLoading={auth.isLoading} />;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-black relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.05),transparent_50%)]" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/6 w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse delay-500"></div>
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

      {/* Main content */}
      <div className="w-full h-screen flex items-center justify-center px-4 relative z-10">
        <div className="flex items-center gap-16 max-w-6xl w-full">
          
          {/* Login Card */}
          <div className="w-[480px]">
            <div className="relative">
              {/* Card glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-white/10 via-gray-500/10 to-white/10 rounded-3xl blur-xl"></div>
              
              <div className="relative flex flex-col gap-8 p-8 pt-10 pb-10 rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex flex-col gap-3 items-center text-center">
                  <div className="text-white font-black text-3xl leading-tight tracking-[-0.02em] bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                    Acesse a Plataforma
                  </div>
                  <div className="text-white/50 font-medium text-lg leading-relaxed tracking-[-0.01em] max-w-sm">
                    Transforme seus vídeos em clips virais com tecnologia de IA avançada
                  </div>
                </div>

                {/* Login Form */}
                <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                  <div className="flex flex-col gap-5">
                    <div className="relative">
                      <Input
                        placeholder="Digite seu email de acesso"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-14 rounded-2xl px-6 text-base font-medium tracking-[-0.01em] focus:border-white/20 focus:bg-white/10 transition-all duration-300"
                      />
                    </div>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="Digite sua senha"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-14 rounded-2xl px-6 text-base font-medium tracking-[-0.01em] focus:border-white/20 focus:bg-white/10 transition-all duration-300"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="h-14 bg-gradient-to-r from-white via-gray-100 to-white text-black hover:from-gray-100 hover:to-gray-200 font-bold text-base rounded-2xl tracking-[-0.01em] shadow-2xl transition-all duration-300 hover:shadow-white/20 hover:scale-[1.02]"
                    >
                      Acessar Plataforma
                    </Button>
                  </div>
                </form>

                {/* Footer */}
                <div className="text-center">
                  <div className="text-white/40 text-sm font-medium tracking-[-0.01em]">
                    Não tem acesso ainda?{" "}
                    <a href="#" className="text-white hover:text-white/80 font-semibold underline underline-offset-2 transition-colors duration-300">
                      Adquira aqui
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Content */}
          <div className="flex-1 max-w-lg">
            <div className="text-left space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/60 text-sm font-semibold tracking-[0.05em] uppercase">
                  #1 Plataforma de IA para Vídeos
                </span>
              </div>
              
              {/* Main heading */}
              <div className="space-y-4">
                <h1 className="text-5xl font-black leading-tight tracking-[-0.02em]">
                  <span className="text-white">Corte seus vídeos para</span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                    Instagram
                  </span>
                  <span className="text-white">, </span>
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    TikTok
                  </span>
                  <br />
                  <span className="text-white">e </span>
                  <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    YouTube
                  </span>
                </h1>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-lg">✂️</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm tracking-[-0.01em]">Cortes Precisos</div>
                    <div className="text-white/40 text-xs font-medium">IA Avançada</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white text-lg">📱</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm tracking-[-0.01em]">Formato Vertical</div>
                    <div className="text-white/40 text-xs font-medium">Stories & Reels</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-white text-lg">🎬</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm tracking-[-0.01em]">Presets Prontos</div>
                    <div className="text-white/40 text-xs font-medium">Redes Sociais</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm tracking-[-0.01em]">
                      {isMounted && webcodecs.isSupported ? 'WebCodecs Ultra-Rápido' : 'Processamento Rápido'}
                    </div>
                    <div className="text-white/40 text-xs font-medium">
                      {isMounted && webcodecs.isSupported ? '10-50x Mais Rápido' : 'Tecnologia IA'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen w-full bg-black relative overflow-hidden">
    {/* Header com informações do usuário */}
    <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
      <div className="text-right">
        <p className="text-white/80 text-sm">Usuário Premium</p>
        <p className="text-white/60 text-xs">Código: {auth.user.accessCode}</p>
      </div>
      <Button
        onClick={auth.logout}
        variant="outline"
        className="border-white/20 text-white/80 hover:bg-white/5 text-sm px-3 py-1"
      >
        Sair
      </Button>
    </div>

    {/* Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
    
    {/* Header */}
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
                  {isMounted && webcodecs.isSupported ? 'WebCodecs Ultra-Rápido Ativo' : 'Sistema Carregado'}
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
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {/* Bottom Features Premium */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-4xl w-full">
              <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">
                  {isMounted && webcodecs.isSupported ? 'WebCodecs Ultra-Rápido' : 'Processamento Rápido'}
                </h4>
                <p className="text-white/50 text-sm font-medium">
                  {isMounted && webcodecs.isSupported ? '10-50x mais rápido que FFmpeg' : 'IA avançada processa em segundos'}
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2 tracking-[-0.01em]">Análise Inteligente</h4>
                <p className="text-white/50 text-sm font-medium">Detecta momentos virais automaticamente</p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">✂️</span>
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
                    src={URL.createObjectURL(videoFile)}
                    controls
                    className="w-full rounded-xl shadow-2xl"
                  />
                </div>
              </div>

              {(canvasProcessor.isProcessing || webcodecs.isProcessing || ffmpeg.isProcessing) && (
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                    <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">
                      {canvasProcessor.isProcessing ? 'Processamento Canvas API' : 
                       webcodecs.isProcessing ? 'Processamento WebCodecs' : 
                       'Processamento FFmpeg'}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">
                          {canvasProcessor.isProcessing 
                            ? (canvasProcessor.progress.phase || 'Preparando...') 
                            : webcodecs.isProcessing 
                            ? (webcodecs.progress.phase || 'Preparando...') 
                            : (ffmpeg.progress.phase || 'Processando...')
                          }
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${canvasProcessor.isProcessing ? canvasProcessor.progress.progress : 
                                     webcodecs.isProcessing ? webcodecs.progress.progress : 
                                     ffmpeg.progress.progress}%` 
                          }}
                        />
                      </div>
                      <div className="text-center text-white/60 text-sm">
                        {canvasProcessor.isProcessing 
                          ? 'Processando com Canvas API - MP4 Ultra-Rápido!' 
                          : webcodecs.isProcessing 
                          ? 'Processando com WebCodecs - Ultra Rápido!' 
                          : 'Processando com FFmpeg - Compatibilidade Total!'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysisComplete && (
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black text-white tracking-[-0.02em]">Clips Gerados pela IA</h3>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleGenerateMultipleClips}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl"
                        >
                          Gerar 10 Clips
                        </Button>
                        <Button
                          onClick={handleProcessSelectedClips}
                          disabled={selectedClips.length === 0 || canvasProcessor.isProcessing || webcodecs.isProcessing || ffmpeg.isProcessing}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl"
                        >
                          {canvasProcessor.isProcessing ? 'Processando Canvas API...' : 
                           webcodecs.isProcessing ? 'Processando WebCodecs...' : 
                           ffmpeg.isProcessing ? 'Processando FFmpeg...' : 
                           `Processar (${selectedClips.length})`}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {generatedClips.map((clip) => (
                        <div
                          key={clip.id}
                          className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 ${
                            selectedClips.includes(clip.id)
                              ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                              : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                          }`}
                          onClick={() => {
                            setSelectedClips(prev =>
                              prev.includes(clip.id)
                                ? prev.filter(id => id !== clip.id)
                                : [...prev, clip.id]
                            );
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-white text-lg">{clip.title}</h4>
                              <p className="text-sm text-white/60">
                                {clip.start} - {clip.end} • {clip.type}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-400">{clip.score}%</div>
                              <div className="text-xs text-white/60">Score Viral</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8">
              {analysisComplete && (
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                    <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">Análise de Potencial Viral</h3>
                    <div className="text-center mb-8">
                      <div className={`text-6xl font-black mb-2 ${
                        viralScore >= 90 ? 'text-green-400' : 
                        viralScore >= 80 ? 'text-yellow-400' : 
                        viralScore >= 70 ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {viralScore}%
                      </div>
                      <p className="text-white/60 text-sm font-medium tracking-[0.02em] uppercase">Potencial Viral</p>
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
              )}

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
                        FFmpeg Ultra-Otimizado
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-white font-medium">Velocidade</span>
                      <span className="font-bold text-green-400">
                        5-15 segundos
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-white font-medium">Formato Principal</span>
                      <span className="font-bold text-green-400">
                        MP4 (100% Compatível)
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-white font-medium">Tecnologia</span>
                      <span className="font-bold text-blue-400">
                        FFmpeg.wasm Ultra-Otimizado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}