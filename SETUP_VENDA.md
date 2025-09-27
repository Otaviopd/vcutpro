# 🚀 VCUT PRO - GUIA COMPLETO DE CONFIGURAÇÃO PARA VENDA

## 📋 RESUMO DO SISTEMA IMPLEMENTADO

✅ **Sistema de autenticação real** com Supabase
✅ **Banco de dados** com usuários, compras e logs
✅ **Webhook Kiwify** para vendas automáticas
✅ **Geração automática** de chaves de acesso
✅ **Sistema de planos** (Básico, Pro, Premium)
✅ **Logs de uso** e estatísticas

---

## 🔧 PASSO 1: CONFIGURAR SUPABASE (GRATUITO)

### 1.1 Criar Conta Supabase
1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub
4. Crie um novo projeto:
   - **Nome:** vcut-pro
   - **Senha:** (escolha uma forte)
   - **Região:** South America (São Paulo)

### 1.2 Configurar Banco de Dados
1. No painel Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole todo o conteúdo do arquivo `database/schema.sql`
4. Clique em **Run** para executar

### 1.3 Obter Credenciais
1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** (algo como: https://xxx.supabase.co)
   - **anon public** key (chave longa)

---

## 🔧 PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 2.1 Criar arquivo .env.local
```bash
# Na pasta raiz do projeto, crie o arquivo .env.local
cp env.example .env.local
```

### 2.2 Preencher as variáveis
```env
# SUPABASE (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# RESEND EMAIL (opcional por enquanto)
RESEND_API_KEY=re_xxxxxxxxx

# KIWIFY (configurar depois)
KIWIFY_WEBHOOK_SECRET=sua_senha_secreta

# NEXT.JS
NEXTAUTH_SECRET=uma_string_aleatoria_muito_longa
NEXTAUTH_URL=http://localhost:3000
```

---

## 🔧 PASSO 3: TESTAR LOCALMENTE

### 3.1 Instalar dependências (se necessário)
```bash
npm install
```

### 3.2 Iniciar servidor
```bash
npm run dev
```

### 3.3 Testar autenticação
1. Acesse: http://localhost:3000
2. Use o código demo: `VCUT-DEMO-123456`
3. Deve funcionar normalmente

### 3.4 Testar webhook (opcional)
```bash
# Simular compra via POST
curl -X POST http://localhost:3000/api/webhook/kiwify \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST123",
    "order_status": "paid",
    "customer_email": "teste@email.com",
    "customer_name": "João Silva",
    "product_name": "VCUT Pro",
    "order_value": 297,
    "created_at": "2024-01-01T00:00:00Z"
  }'
```

---

## 🚀 PASSO 4: DEPLOY VERCEL (GRATUITO)

### 4.1 Preparar para deploy
1. Commit todas as alterações:
```bash
git add .
git commit -m "Sistema de venda implementado"
git push
```

### 4.2 Deploy na Vercel
1. Acesse: https://vercel.com
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione seu repositório VCUT_WINDSURF
5. Configure as variáveis de ambiente:
   - Adicione todas as variáveis do .env.local
   - **IMPORTANTE:** Use a URL de produção no NEXTAUTH_URL

### 4.3 Obter URL de produção
- Após deploy: https://vcut-pro-xxx.vercel.app
- Anote esta URL para configurar na Kiwify

---

## 💳 PASSO 5: CONFIGURAR KIWIFY

### 5.1 Criar produtos na Kiwify
1. **VCUT Pro Básico** - R$ 197 (6 meses)
2. **VCUT Pro** - R$ 297 (1 ano)  
3. **VCUT Pro Premium** - R$ 497 (vitalício)

### 5.2 Configurar Webhook
1. Em cada produto, vá em **Configurações** → **Webhook**
2. **URL do Webhook:** https://sua-url.vercel.app/api/webhook/kiwify
3. **Eventos:** Marque "Pagamento Aprovado"
4. **Método:** POST
5. Salve e teste

---

## 📧 PASSO 6: CONFIGURAR EMAILS (OPCIONAL)

### 6.1 Criar conta Resend (3000 emails grátis/mês)
1. Acesse: https://resend.com
2. Crie conta gratuita
3. Obtenha API Key
4. Adicione no .env.local

### 6.2 Implementar envio real (se quiser)
- Por enquanto, os emails aparecem no console
- Para produção, descomente o código de envio real

---

## 🎯 PASSO 7: TESTAR VENDA COMPLETA

### 7.1 Fluxo de teste
1. Faça uma compra teste na Kiwify
2. Verifique se o webhook foi chamado (logs Vercel)
3. Confirme se o usuário foi criado no Supabase
4. Teste login com a chave gerada

### 7.2 Monitoramento
- **Supabase:** Painel → Table Editor → users
- **Vercel:** Functions → Logs
- **Kiwify:** Relatórios → Webhooks

---

## 💰 ESTRUTURA DE PREÇOS SUGERIDA

| Plano | Preço | Duração | Recursos |
|-------|-------|---------|----------|
| **Básico** | R$ 197 | 6 meses | Processamento ilimitado |
| **Pro** | R$ 297 | 1 ano | + Suporte prioritário |
| **Premium** | R$ 497 | Vitalício | + Atualizações futuras |

---

## 📊 CUSTOS OPERACIONAIS

### Gratuito até:
- **Supabase:** 50.000 usuários
- **Vercel:** Tráfego ilimitado
- **Resend:** 3.000 emails/mês
- **Kiwify:** Apenas taxa por venda (6.9%)

### Exemplo de ROI:
```
100 vendas/mês × R$ 297 = R$ 29.700
Taxa Kiwify (6.9%) = R$ 2.049
Custos fixos = R$ 0
LUCRO LÍQUIDO = R$ 27.651/mês
```

---

## 🔧 MANUTENÇÃO

### Monitoramento diário:
- Verificar logs de erro no Vercel
- Acompanhar vendas no Kiwify
- Monitorar usuários no Supabase

### Backup:
- Supabase faz backup automático
- Código está no GitHub
- Configurações documentadas

---

## 🆘 SUPORTE

### Se algo não funcionar:
1. Verifique logs no Vercel
2. Confirme variáveis de ambiente
3. Teste webhook manualmente
4. Verifique conexão Supabase

### Contatos de emergência:
- **Supabase:** https://supabase.com/docs
- **Vercel:** https://vercel.com/docs
- **Kiwify:** Suporte via chat

---

## ✅ CHECKLIST FINAL

- [ ] Supabase configurado e testado
- [ ] Variáveis de ambiente definidas
- [ ] Deploy Vercel funcionando
- [ ] Webhook Kiwify configurado
- [ ] Produtos criados na Kiwify
- [ ] Teste de compra realizado
- [ ] Sistema de login funcionando
- [ ] Processamento de vídeo operacional

**🎉 PARABÉNS! SEU VCUT PRO ESTÁ PRONTO PARA VENDER!**
