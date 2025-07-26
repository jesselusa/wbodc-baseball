import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key (bypasses RLS)
// Only use this in API routes, never on the client side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 