#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables');
    console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'Set' : 'Missing');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('frameworks').select('count', { count: 'exact' });
    
    if (error) {
      console.error('Connection test failed:', error.message);
      
      if (error.message.includes('relation "frameworks" does not exist')) {
        console.log('\n✅ Connection successful! Database schema needs to be created.');
        console.log('Run the database migrations to create tables.');
      } else {
        console.error('❌ Connection failed with error:', error);
      }
    } else {
      console.log('✅ Connection successful! Found', data?.length || 0, 'frameworks');
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
  }
}

testConnection();