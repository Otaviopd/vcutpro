"use client";
import React from "react";
import { VideoProcessor } from '../componentes/VideoProcessor';
import { useAuthHook } from "../hooks/useAuth";
import LoginScreen from "../componentes/LoginScreen";

export default function VCutPlatform() {
  const auth = useAuthHook();

  // Mostrar tela de login se não autenticado
  if (!auth.user) {
    return <LoginScreen onLogin={auth.login} isLoading={auth.isLoading} />;
  }

  // Mostrar processador de vídeo se autenticado
  return (
    <VideoProcessor onLogout={auth.logout} />
  );
}
