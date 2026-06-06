// Variáveis de ambiente públicas (somente EXPO_PUBLIC_* vão para o cliente).
// NUNCA exponha a service-role key aqui.

function read(name: string, value: string | undefined): string {
  if (!value) {
    // Em dev, avisa sem quebrar a navegação; em produção, configure o .env.
    console.warn(`[env] ${name} ausente — configure no .env (ver .env.example).`);
    return '';
  }
  return value;
}

export const ENV = {
  SUPABASE_URL: read('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: read('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
};

export const isSupabaseConfigured = Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);
