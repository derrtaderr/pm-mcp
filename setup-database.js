#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setupDatabase() {
  console.log('Setting up AI PM MCP database...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  try {
    console.log('✅ Creating database schema...');
    
    // Read and execute schema migration
    const schemaSQL = readFileSync(join(__dirname, 'supabase/migrations/001_initial_schema.sql'), 'utf8');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (schemaError) {
      console.error('❌ Schema creation failed:', schemaError);
      return;
    }
    
    console.log('✅ Database schema created successfully!');
    
    console.log('✅ Seeding initial data...');
    
    // Read and execute seed data
    const seedSQL = readFileSync(join(__dirname, 'supabase/seed.sql'), 'utf8');
    const { error: seedError } = await supabase.rpc('exec_sql', { sql: seedSQL });
    
    if (seedError) {
      console.error('❌ Seed data failed:', seedError);
      return;
    }
    
    console.log('✅ Seed data inserted successfully!');
    
    // Verify setup
    const { data: frameworks, error: testError } = await supabase
      .from('frameworks')
      .select('name, category')
      .limit(5);
    
    if (testError) {
      console.error('❌ Verification failed:', testError);
      return;
    }
    
    console.log('✅ Database setup complete!');
    console.log('Available frameworks:');
    frameworks.forEach(f => console.log(`  - ${f.name} (${f.category})`));
    
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  }
}

setupDatabase();