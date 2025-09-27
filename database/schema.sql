-- VCUT PRO - SCHEMA DO BANCO DE DADOS (SUPABASE GRATUITO)
-- Execute este SQL no painel do Supabase

-- Tabela de usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  access_key VARCHAR(50) UNIQUE NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  plan_type VARCHAR(20) DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'premium')),
  last_login TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- Tabela de compras (histórico)
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kiwify_transaction_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'pro', 'premium')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  webhook_data JSONB
);

-- Tabela de logs de uso
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'login', 'process_video', 'download'
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_access_key ON users(access_key);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_purchases_transaction_id ON purchases(kiwify_transaction_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

-- Função para gerar chave de acesso única
CREATE OR REPLACE FUNCTION generate_access_key()
RETURNS VARCHAR(50) AS $$
DECLARE
  key_prefix VARCHAR(10) := 'VCUT-';
  random_part VARCHAR(40);
  full_key VARCHAR(50);
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar parte aleatória (8 caracteres alfanuméricos)
    random_part := upper(substring(md5(random()::text) from 1 for 8));
    full_key := key_prefix || random_part;
    
    -- Verificar se a chave já existe
    SELECT EXISTS(SELECT 1 FROM users WHERE access_key = full_key) INTO key_exists;
    
    -- Se não existe, retornar a chave
    IF NOT key_exists THEN
      RETURN full_key;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar chave automaticamente
CREATE OR REPLACE FUNCTION set_access_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_key IS NULL OR NEW.access_key = '' THEN
    NEW.access_key := generate_access_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_access_key
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_access_key();

-- RLS (Row Level Security) - Segurança
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (usuários só veem seus próprios dados)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Inserir usuário demo para testes
INSERT INTO users (email, access_key, plan_type, is_active) 
VALUES ('demo@vcutpro.com', 'VCUT-DEMO-123456', 'premium', true);

-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela principal de usuários do VCUT Pro';
COMMENT ON TABLE purchases IS 'Histórico de compras via Kiwify';
COMMENT ON TABLE usage_logs IS 'Logs de uso da plataforma';
COMMENT ON FUNCTION generate_access_key() IS 'Gera chaves de acesso únicas no formato VCUT-XXXXXXXX';
