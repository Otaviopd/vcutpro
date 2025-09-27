"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuthReal } from '../hooks/useAuthReal';

interface LoginScreenProps {
  onLogin: (accessCode: string) => Promise<boolean>;
  isLoading: boolean;
}

export default function LoginScreen({ onLogin, isLoading }: LoginScreenProps) {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuthReal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!accessCode.trim()) {
      setError('Por favor, digite seu código de acesso');
      return;
    }
    
    const success = await onLogin(accessCode.trim().toUpperCase());
    
    if (!success) {
      setError('Código de acesso inválido. Verifique e tente novamente.');
    }
  };

  const handleDemoAccess = async () => {
    // Código demo para demonstração
    const demoCode = 'VCUT-DEMO-123456';
    await onLogin(demoCode);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 tracking-[-0.02em]">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              VCUT
            </span>
            <span className="text-white"> PRO</span>
          </h1>
          <p className="text-white/60">Processamento de vídeo ultra-rápido</p>
        </div>

        {/* Card de Login */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Acesse sua conta
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Código de Acesso
                </label>
                <Input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="VCUT-XXXXX-XXXXX"
                  className="w-full bg-white/5 border-white/20 text-white placeholder-white/40 focus:border-blue-500"
                  disabled={isLoading}
                />
                <p className="text-white/50 text-xs mt-2">
                  Digite o código que você recebeu por email após a compra
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl"
              >
                {isLoading ? 'Verificando...' : 'Acessar Plataforma'}
              </Button>
            </form>

            {/* Separador */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-white/10"></div>
              <span className="px-4 text-white/40 text-sm">ou</span>
              <div className="flex-1 border-t border-white/10"></div>
            </div>

            {/* Botões adicionais */}
            <div className="space-y-3">
              <Button
                onClick={() => setShowDemo(!showDemo)}
                variant="outline"
                className="w-full border-white/20 text-white/80 hover:bg-white/5"
              >
                Ver Demonstração
              </Button>

              {showDemo && (
                <Button
                  onClick={handleDemoAccess}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl"
                >
                  Acesso Demo (Teste Grátis)
                </Button>
              )}

              <div className="text-center">
                <a
                  href="https://kiwify.com.br/vcut-pro" // Seu link da Kiwify
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Ainda não tem acesso? Compre agora
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-sm">
          <p>© 2024 VCUT Pro. Todos os direitos reservados.</p>
          <p className="mt-2">
            Suporte: <a href="mailto:contato@vcut.com.br" className="text-blue-400">contato@vcut.com.br</a>
          </p>
        </div>
      </div>
    </div>
  );
}
