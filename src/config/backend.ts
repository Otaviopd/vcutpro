// Configuração do Backend
export const BACKEND_CONFIG = {
  // URL do backend (será atualizada após deploy)
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://vcut-backend.railway.app' // URL será gerada pelo Railway
    : 'http://localhost:8000',
  
  // Endpoints
  ENDPOINTS: {
    UPLOAD: '/upload',
    MANUAL_CUT: '/manual-cut',
    STATUS: '/status',
    DOWNLOAD: '/download'
  },
  
  // Configurações
  POLLING_INTERVAL: 2000, // 2 segundos
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  SUPPORTED_FORMATS: ['mp4', 'mov', 'avi', 'webm', 'mkv']
};

// Helper para construir URLs
export const buildUrl = (endpoint: string, ...params: string[]) => {
  const base = BACKEND_CONFIG.BASE_URL;
  const path = params.length > 0 ? `${endpoint}/${params.join('/')}` : endpoint;
  return `${base}${path}`;
};
