"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "../../componentes/ui/button";
import { Input } from "../../componentes/ui/input";
import { downloadBlob, type ClipData } from "../hooks/useFFmpeg";
import { useWebCodecs } from "../hooks/useWebCodecs";

export default function VCutPlatform() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:30");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [viralScore, setViralScore] = useState(0);
  const [generatedClips, setGeneratedClips] = useState<ClipData[]>([]);
  const [selectedClips, setSelectedClips] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Hook de processamento WebCodecs
  const webcodecs = useWebCodecs();

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setAnalysisComplete(false);
      setGeneratedClips([]);
      // Simular análise automática
      setTimeout(() => analyzeVideo(), 1000);
    }
  };

  const analyzeVideo = () => {
    // Simulação da análise de IA
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

  const handleProcessSelectedClips = async () => {
    if (!videoFile || selectedClips.length === 0) {
      alert('Selecione pelo menos um clip para processar!');
      return;
    }

    if (!webcodecs.isSupported) {
      alert('WebCodecs não é suportado neste navegador. Use Chrome/Edge mais recente.');
      return;
    }

    try {
      const clipsToProcess = generatedClips.filter(clip => selectedClips.includes(clip.id));
      
      if (clipsToProcess.length === 1) {
        const clip = clipsToProcess[0];
        const blob = await webcodecs.processSingleClip(videoFile, clip.start, clip.end, clip.title);
        downloadBlob(blob, `${clip.title.replace(/\s+/g, '_')}.webm`);
        alert('✅ Clip processado e baixado com sucesso!');
      } else {
        const results = await webcodecs.processVideo(videoFile, clipsToProcess);
        
        Object.entries(results).forEach(([clipId, blob]) => {
          const clip = clipsToProcess.find(c => c.id === parseInt(clipId));
          if (clip) {
            downloadBlob(blob, `${clip.title.replace(/\s+/g, '_')}.webm`);
          }
        });
        
        alert(`✅ ${clipsToProcess.length} clips processados e baixados com sucesso!`);
      }
      
      setSelectedClips([]);
      
    } catch (error) {
      console.error('Erro no processamento:', error);
      alert('❌ Erro no processamento. Tente novamente.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-black relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20" />
        
        {/* Logo */}
        <div className="fixed left-8 top-8 z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-white via-gray-200 to-gray-400 rounded-2xl flex items-center justify-center">
              <span className="text-black font-black text-xl">V</span>
            </div>
            <div>
              <span className="text-white font-black text-2xl">VCUT</span>
              <span className="text-white/60 font-light text-2xl"> Pro</span>
            </div>
          </div>
        </div>

        {/* Login form */}
        <div className="w-full h-screen flex items-center justify-center px-4">
          <div className="w-[480px] p-8 rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/10">
            <div className="text-center mb-8">
              <h1 className="text-white font-black text-3xl mb-4">Acesse a Plataforma</h1>
              <p className="text-white/50">Transforme seus vídeos em clips virais</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="space-y-4">
                <Input
                  placeholder="Digite seu email"
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl"
                />
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl"
                />
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-white text-black font-bold rounded-2xl"
                >
                  Acessar Plataforma
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
              <span className="text-black font-black text-xl">V</span>
            </div>
            <span className="text-white font-black text-2xl">VCUT Pro</span>
          </div>
          
          <div className="text-right">
            <div className="text-white/60 text-sm">
              {webcodecs.isSupported ? '✅ WebCodecs Ultra-Rápido' : '⚠️ WebCodecs não suportado'}
            </div>
          </div>
        </div>

        {!videoFile ? (
          /* Upload Section */
          <div className="text-center py-20">
            <h2 className="text-4xl font-black mb-8">Faça Upload do Seu Vídeo</h2>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-black font-bold px-8 py-4 rounded-2xl text-lg"
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
          </div>
        ) : (
          /* Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Preview */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-black/80 rounded-2xl p-8 border border-white/10">
                <h3 className="text-xl font-bold mb-4">Preview do Vídeo</h3>
                <video
                  ref={videoRef}
                  src={URL.createObjectURL(videoFile)}
                  controls
                  className="w-full rounded-xl"
                />
              </div>

              {/* Processing Status */}
              {webcodecs.isProcessing && (
                <div className="bg-black/80 rounded-2xl p-8 border border-white/10">
                  <h3 className="text-xl font-bold mb-4">Processamento WebCodecs</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>{webcodecs.progress.phase || 'Preparando...'}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${webcodecs.progress.progress}%` }}
                      />
                    </div>
                    <div className="text-center text-sm text-white/60">
                      Processando com WebCodecs - Ultra Rápido!
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Clips */}
              {analysisComplete && (
                <div className="bg-black/80 rounded-2xl p-8 border border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Clips Gerados</h3>
                    <div className="flex gap-4">
                      <Button
                        onClick={handleGenerateMultipleClips}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Gerar 10 Clips
                      </Button>
                      <Button
                        onClick={handleProcessSelectedClips}
                        disabled={selectedClips.length === 0 || webcodecs.isProcessing}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        Processar Selecionados ({selectedClips.length})
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {generatedClips.map((clip) => (
                      <div
                        key={clip.id}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedClips.includes(clip.id)
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
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
                            <h4 className="font-bold">{clip.title}</h4>
                            <p className="text-sm text-white/60">
                              {clip.start} - {clip.end} • {clip.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400">{clip.score}%</div>
                            <div className="text-xs text-white/60">Score Viral</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {analysisComplete && (
                <div className="bg-black/80 rounded-2xl p-8 border border-white/10">
                  <h3 className="text-xl font-bold mb-6">Análise Viral</h3>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-black text-green-400 mb-2">{viralScore}%</div>
                    <p className="text-white/60 text-sm">Potencial Viral</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Engajamento</span>
                      <span className="font-bold">{Math.floor(viralScore * 0.9)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retenção</span>
                      <span className="font-bold">{Math.floor(viralScore * 0.85)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shareability</span>
                      <span className="font-bold">{Math.floor(viralScore * 0.95)}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-black/80 rounded-2xl p-8 border border-white/10">
                <h3 className="text-xl font-bold mb-4">Status do Sistema</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Tecnologia</span>
                    <span className="font-bold text-green-400">
                      {webcodecs.isSupported ? 'WebCodecs' : 'Não Suportado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance</span>
                    <span className="font-bold text-green-400">
                      {webcodecs.isSupported ? '10-50x Mais Rápido' : 'Limitado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
