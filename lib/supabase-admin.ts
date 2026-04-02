import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key (bypasses RLS)
// Only use this in API routes, never on the client side
// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabaseAdmin: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
	get(_, prop) {
		if (!_supabaseAdmin) {
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
			const supabaseServiceKey = process.env.SUPABASE_SECRET_API_KEY;
			if (!supabaseUrl || !supabaseServiceKey) {
				throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_API_KEY');
			}
			_supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
		}
		return (_supabaseAdmin as any)[prop];
	}
}); 