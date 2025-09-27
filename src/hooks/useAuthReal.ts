'use client';

import { useState, useEffect } from 'react';
import { supabase, type User } from '../lib/supabase';

// Obter URL do Supabase para verificar se está configurado
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuthReal = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Verificar se usuário está logado ao carregar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const accessKey = localStorage.getItem('vcut_access_key');
      if (!accessKey) {
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await validateAccessKey(accessKey);
      if (user) {
        setAuthState({ user, isLoading: false, isAuthenticated: true });
        // Log do login
        await logUserAction(user.id, 'login');
      } else {
        localStorage.removeItem('vcut_access_key');
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setAuthState({ user: null, isLoading: false, isAuthenticated: false });
    }
  };

  const validateAccessKey = async (accessKey: string): Promise<User | null> => {
    try {
      // Modo demo - aceitar chaves específicas sem Supabase
      const demoKeys = [
        'VCUT-DEMO-123456',
        'VCUT-TEST-789012',
        'VCUT-PRO-345678'
      ];

      if (demoKeys.includes(accessKey)) {
        // Retornar usuário demo
        const demoUser: User = {
          id: 'demo-user-id',
          email: 'demo@vcutpro.com',
          access_key: accessKey,
          purchase_date: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          expires_at: null,
          plan_type: 'premium'
        };
        return demoUser;
      }

      // Tentar Supabase se configurado
      if (supabaseUrl !== 'https://demo.supabase.co') {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('access_key', accessKey)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          console.error('Chave de acesso inválida:', error);
          return null;
        }

        // Verificar se não expirou
        if (data.expires_at) {
          const now = new Date();
          const expiresAt = new Date(data.expires_at);
          if (now > expiresAt) {
            console.error('Chave de acesso expirada');
            return null;
          }
        }

        // Atualizar último login
        await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            usage_count: data.usage_count + 1
          })
          .eq('id', data.id);

        return data as User;
      }

      return null;
    } catch (error) {
      console.error('Erro ao validar chave:', error);
      return null;
    }
  };

  const login = async (accessKey: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const user = await validateAccessKey(accessKey);
      if (user) {
        localStorage.setItem('vcut_access_key', accessKey);
        setAuthState({ user, isLoading: false, isAuthenticated: true });
        return true;
      } else {
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setAuthState({ user: null, isLoading: false, isAuthenticated: false });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('vcut_access_key');
    setAuthState({ user: null, isLoading: false, isAuthenticated: false });
  };

  const logUserAction = async (userId: string, action: string, details?: any) => {
    try {
      await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          action,
          details: details || {}
        });
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
    }
  };

  const getUserStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('action, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const stats = {
        totalActions: data?.length || 0,
        videosProcessed: data?.filter(log => log.action === 'process_video').length || 0,
        lastActivity: data?.[0]?.created_at || null
      };

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  };

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    logUserAction,
    getUserStats,
    validateAccessKey
  };
};
