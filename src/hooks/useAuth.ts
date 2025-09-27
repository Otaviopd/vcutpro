"use client";

import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  email: string;
  name: string;
  accessCode: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (accessCode: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const useAuthHook = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se usuário já está logado
  useEffect(() => {
    const savedUser = localStorage.getItem('vcut_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error);
        localStorage.removeItem('vcut_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Função de login com código de acesso
  const login = async (accessCode: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Verificar código com a API
      const response = await fetch(`/api/webhook/kiwify?code=${accessCode}`);
      const result = await response.json();
      
      if (result.valid) {
        const userData: User = {
          email: 'user@email.com', // Em produção, pegar do banco
          name: 'Usuário Premium', // Em produção, pegar do banco
          accessCode: accessCode,
          isAuthenticated: true
        };
        
        setUser(userData);
        localStorage.setItem('vcut_user', JSON.stringify(userData));
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Função de logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('vcut_user');
  };

  return {
    user,
    login,
    logout,
    isLoading
  };
};
