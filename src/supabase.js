import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://SEU_PROJETO.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'SUA_CHAVE_ANON'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
