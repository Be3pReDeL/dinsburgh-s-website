import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../content/supabaseClient';

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL ?? '';

export const isAuthConfigured = () =>
  Boolean(isSupabaseConfigured && adminEmail);

export const getAdminEmail = () => adminEmail;

export const getSession = async () => {
  if (!supabase || !isAuthConfigured()) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
};

export const onAuthStateChange = (callback: (session: Session | null) => void) => {
  if (!supabase) return null;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
};

export const signIn = async (password: string) => {
  if (!supabase || !isAuthConfigured()) {
    throw new Error('Supabase не настроен для авторизации.');
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password,
  });
  if (error) {
    throw error;
  }
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};
