import { writable } from 'svelte/store';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export const user = writable<User | null>(null);

// Supabase comprueba la sesión al cargar la página automáticamente
supabase.auth.getSession().then(({ data: { session } }) => {
    user.set(session?.user ?? null);
});

// Y escucha cambios (login, logout, auto-refresh)
supabase.auth.onAuthStateChange((_event, session) => {
    user.set(session?.user ?? null);
});