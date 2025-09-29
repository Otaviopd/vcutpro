/**
 * Componente para o novo sistema inteligente de cortes
 * Interface profissional inspirada em OpusClip/Wisecut
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../componentes/ui/button';
import { useIntelligentProcessor, IntelligentClipData } from '../hooks/useIntelligentProcessor';

interface IntelligentProcessorProps {
  videoFile: File;
  onComplete: (clips: IntelligentClipData[]) => void;
}

export const IntelligentProcessor: React.FC<IntelligentProcessorProps> = ({
  videoFile,
  onComplete
}) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [clips, setClips] = useState<IntelligentClipData[]>([]);
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  
  const processor = useIntelligentProcessor();

  useEffect(() => {
    if (videoFile) {
      startProcessing();
    }
  }, [videoFile]);

  const startProcessing = async () => {
    try {
      const id = await processor.processVideo(videoFile);
      setJobId(id);
      
      // Polling para aguardar conclusão
      const checkStatus = async () => {
        const status = await processor.getStatus(id);
        
        if (status.status === 'completed') {
          setClips(status.clips);
          setSelectedClips(status.clips.map((c: IntelligentClipData) => c.id));
          onComplete(status.clips);
        } else if (status.status !== 'error') {
          setTimeout(checkStatus, 2000);
        }
      };
      
      setTimeout(checkStatus, 2000);
      
    } catch (error) {
      console.error('Erro no processamento:', error);
    }
  };

  const toggleClipSelection = (clipId: string) => {
    setSelectedClips(prev => 
      prev.includes(clipId) 
        ? prev.filter(id => id !== clipId)
        : [...prev, clipId]
    );
  };

  const downloadSelected = async () => {
    if (!jobId) return;
    
    for (const clipId of selectedClips) {
      try {
        await processor.downloadClip(jobId, clipId);
      } catch (error) {
        console.error(`Erro no download do clip ${clipId}:`, error);
      }
    }
  };

  if (processor.isProcessing) {
    return (
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
        <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-black text-white tracking-[-0.02em] mb-6">
            🤖 Sistema Inteligente Processando
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">
                {processor.progress.phase}
              </span>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${processor.progress.progress}%` }}
              />
            </div>
            
            <div className="text-center text-white/60 text-sm">
              <div className="mb-2">Pipeline Profissional Ativo:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>✅ Transcrição Whisper</div>
                <div>✅ Análise NLP</div>
                <div>✅ Detecção de Cenas</div>
                <div>✅ Cortes Inteligentes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl" />
        <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white tracking-[-0.02em]">
                🎯 Clips Inteligentes Gerados
              </h3>
              <p className="text-white/60 text-sm mt-1">
                Baseado em análise de relevância, pausas e mudanças de cena
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-black text-green-400">
                {clips.length}
              </div>
              <div className="text-white/60 text-xs uppercase tracking-wider">
                Clips Virais
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de clips */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
        <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          
          <div className="grid grid-cols-2 gap-6">
            {clips.map((clip) => (
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
                  <h4 className="text-white font-bold">{clip.filename}</h4>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-bold ${
                      clip.viral_potential >= 80 ? 'text-green-400' : 
                      clip.viral_potential >= 70 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {clip.viral_potential}%
                    </div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <p className="text-white/60 text-sm mb-3 line-clamp-2">
                  {clip.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">
                    {Math.floor(clip.start_time / 60)}:{(Math.floor(clip.start_time % 60)).toString().padStart(2, '0')} - {Math.floor(clip.end_time / 60)}:{(Math.floor(clip.end_time % 60)).toString().padStart(2, '0')}
                  </span>
                  <span className="text-purple-400 font-medium">
                    {Math.floor(clip.duration)}s
                  </span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span>🎯 Impacto: {clip.impact_score}</span>
                    <span>•</span>
                    <span>📱 Vertical 9:16</span>
                    <span>•</span>
                    <span>📝 Com Legendas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controles */}
          <div className="mt-8 flex gap-4">
            <Button
              onClick={() => setSelectedClips(clips.map(c => c.id))}
              variant="outline"
              className="flex-1 border-white/20 text-white/80 hover:bg-white/5"
            >
              Selecionar Todos ({clips.length})
            </Button>
            
            <Button
              onClick={() => setSelectedClips([])}
              variant="outline"
              className="flex-1 border-white/20 text-white/80 hover:bg-white/5"
            >
              Limpar Seleção
            </Button>
            
            <Button
              onClick={downloadSelected}
              disabled={selectedClips.length === 0}
              className="flex-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
            >
              📥 Baixar {selectedClips.length} Clips
            </Button>
          </div>
          
          <div className="mt-4 text-center text-white/50 text-xs">
            💡 Clips otimizados com IA para máximo engajamento em redes sociais
          </div>
        </div>
      </div>
    </div>
  );
};
