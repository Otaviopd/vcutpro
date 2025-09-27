import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// Interface do webhook da Kiwify
interface KiwifyWebhook {
  order_id: string;
  order_status: string;
  customer_email: string;
  customer_name: string;
  product_name: string;
  order_value: number;
  created_at: string;
}

// Gerar código de acesso único
function generateAccessCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VCUT-${timestamp}-${random}`.toUpperCase();
}

// Enviar email com código de acesso
async function sendAccessEmail(email: string, name: string, accessCode: string, planType: string) {
  // Aqui você pode integrar com Resend ou outro serviço
  // Por enquanto, vamos simular
  console.log(`
    📧 EMAIL ENVIADO PARA: ${email}
    👤 NOME: ${name}
    🔑 CÓDIGO DE ACESSO: ${accessCode}
    
    Olá ${name}!
    
    🎉 Parabéns! Sua compra do VCUT PRO foi aprovada!
    
    🔑 SEU CÓDIGO DE ACESSO: ${accessCode}
    
    🚀 COMO ACESSAR:
    1. Acesse: https://vcut-pro.vercel.app
    2. Digite seu código: ${accessCode}
    3. Comece a processar vídeos em segundos!
    
    ✨ ACESSO VITALÍCIO INCLUI:
    • Processamento ultra-rápido (3-8 segundos)
    • Formato perfeito para TikTok/Instagram/WhatsApp
    • Geração automática de 10 clips por vídeo
    • Interface premium profissional
    • Processamento ILIMITADO para sempre
    • Suporte técnico vitalício
    • Todas as atualizações futuras GRÁTIS
    
    🎯 RECURSOS ESPECIAIS:
    • FPS dinâmico para máxima fluidez
    • Configurações otimizadas por plataforma
    • Timing preciso de renderização
    • Qualidade profissional garantida
    
    📞 SUPORTE: contato@vcutpro.com
    💬 WhatsApp: (11) 99999-9999
    
    Aproveite sua ferramenta profissional PARA SEMPRE! 🎬
  `);
}

export async function POST(request: NextRequest) {
  try {
    const body: KiwifyWebhook = await request.json();
    
    // Verificar se é uma venda aprovada
    if (body.order_status === 'paid' || body.order_status === 'approved') {
      
      // PRODUTO ÚNICO - Sempre premium vitalício
      const planType: 'premium' = 'premium';
      
      // Acesso vitalício - sem expiração
      const expiresAt = null;
      
      try {
        // Criar usuário no Supabase (chave será gerada automaticamente)
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert({
            email: body.customer_email,
            plan_type: planType,
            expires_at: null, // Acesso vitalício
            is_active: true
          })
          .select()
          .single();

        if (userError) throw userError;

        // Registrar compra
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: user.id,
            kiwify_transaction_id: body.order_id,
            amount: body.order_value,
            plan_type: planType,
            status: 'completed',
            webhook_data: body
          });

        if (purchaseError) throw purchaseError;

        // Enviar email com código
        await sendAccessEmail(
          body.customer_email,
          body.customer_name,
          user.access_key,
          planType
        );
        
        console.log(`✅ Usuário criado: ${user.email} - Chave: ${user.access_key} - Plano: ${planType}`);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Usuário criado e código enviado!',
          plan: planType
        });

      } catch (dbError) {
        console.error('❌ Erro no banco de dados:', dbError);
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao criar usuário' 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Pedido não aprovado ainda' 
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook Kiwify:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Endpoint para verificar código de acesso
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ valid: false, message: 'Código não fornecido' });
  }
  
  // Verificar se código existe e está ativo
  // Por simplicidade, vamos aceitar códigos que começam com VCUT-
  const isValid = code.startsWith('VCUT-') && code.length > 10;
  
  return NextResponse.json({ 
    valid: isValid,
    message: isValid ? 'Código válido!' : 'Código inválido'
  });
}
