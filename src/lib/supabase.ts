import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export async function initializeSupabase(): Promise<SupabaseClient> {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Test connection
  try {
    const { data, error } = await supabase.from('frameworks').select('count', { count: 'exact' });
    if (error) {
      console.error('Supabase connection test failed:', error);
      throw error;
    }
    console.error('Supabase connected successfully');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    throw error;
  }

  return supabase;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
  }
  return supabase;
}