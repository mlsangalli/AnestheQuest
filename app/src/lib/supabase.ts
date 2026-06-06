import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAnestheQuestClient } from '@anesthequest/core';
import { ENV } from './env';

// Client único do app. Sessão persistida via AsyncStorage (web + mobile).
export const supabase = createAnestheQuestClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
