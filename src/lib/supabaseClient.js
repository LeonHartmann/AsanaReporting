import { createClient } from '@supabase/supabase-js';

// Client-side (browser) client - uses the public anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Client-side Supabase functionality might be limited.');
  // You might want to throw an error here in development
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null; // Provide a null fallback if keys are missing

// Server-side client - uses the service role key (should only be used in API routes/server-side functions)
// IMPORTANT: Never expose the service role key in the browser!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// We need a separate function to create the server client on demand within API routes
// to ensure the service key isn't bundled for the client.
export const createServerSupabaseClient = () => {
  const serverSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Still need the URL
  const serverSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serverSupabaseUrl || !serverSupabaseServiceKey) {
    console.error('Supabase URL or Service Role Key is missing for server-side operations.');
    // Throwing an error might be appropriate here as server operations often rely on this
    throw new Error('Server-side Supabase configuration is incomplete.'); 
  }
  
  return createClient(serverSupabaseUrl, serverSupabaseServiceKey);
}; 