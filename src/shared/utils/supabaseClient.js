import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

const supabaseUrl = getEnv('VITE_SUPABASE_URL', '');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', '');


if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SUPABASE] Configuración incompleta. Verifica tu archivo .env');
  console.warn('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY configurados.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'sb-patrimonio-auth-token',
      },
      storage: {
        bucketId: 'urls-sipreb',
      },
    })
  : null;

export default supabase;
