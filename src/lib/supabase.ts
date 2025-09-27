import { createClient } from '@supabase/supabase-js'

// Configuração real do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://igdrvjejkqylizmfpiah.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZHJ2amVqa3F5bGl6bWZwaWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NDE0NDMsImV4cCI6MjA3NDUxNzQ0M30.Wh96-SoEC_icL2W3ms7Y_ifWuCEb827KzryIuCAJ4eM'

// Cliente Supabase (funciona mesmo sem configuração real)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos TypeScript para o banco
export interface User {
  id: string
  email: string
  access_key: string
  purchase_date: string
  is_active: boolean
  created_at: string
  expires_at?: string
  plan_type: 'basic' | 'pro' | 'premium'
}

export interface Purchase {
  id: string
  user_id: string
  kiwify_transaction_id: string
  amount: number
  plan_type: 'basic' | 'pro' | 'premium'
  status: 'pending' | 'completed' | 'refunded'
  created_at: string
}
