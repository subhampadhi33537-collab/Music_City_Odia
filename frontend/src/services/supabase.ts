import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
	throw new Error('Missing or invalid VITE_SUPABASE_URL. Set it to your Supabase project URL.');
}

if (!supabaseAnonKey) {
	throw new Error('Missing Supabase public key. Set VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
