import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAnestheQuestClient } from '@anesthequest/core';
import { ENV } from './env';

// Fallbacks evitam que createClient lance quando o .env não está configurado
// (permite abrir o app e ver o aviso "Supabase não configurado").
const SUPABASE_URL = ENV.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY || 'anon-placeholder-key';

// Client único do app. Sessão persistida via AsyncStorage (web + mobile).
export const supabase = createAnestheQuestClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
