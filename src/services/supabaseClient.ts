import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Config:', { 
  url: supabaseUrl ? 'Defined' : 'UNDEFINED', 
  key: supabaseAnonKey ? 'Defined' : 'UNDEFINED' 
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing! Make sure .env is created and dev server is RESTARTED.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key');
