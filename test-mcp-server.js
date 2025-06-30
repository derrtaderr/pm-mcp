#!/usr/bin/env node

import 'dotenv/config';
import { AIPMToolkitServer } from './dist/services/ai-pm-toolkit-server.js';
import { initializeSupabase } from './dist/lib/supabase.js';

async function testMCPServer() {
  console.log('Testing MCP Server functionality...');
  
  try {
    // Initialize Supabase
    await initializeSupabase();
    console.log('✅ Supabase connection initialized');
    
    // Create server instance
    const server = new AIPMToolkitServer();
    console.log('✅ MCP Server instance created');
    
    // Test get_pm_frameworks
    console.log('\n🧪 Testing get_pm_frameworks...');
    const frameworks = await server.get_pm_frameworks({
      category: 'prioritization'
    });
    
    console.log(`✅ Found ${frameworks.total_count} prioritization frameworks`);
    if (frameworks.available_frameworks.length > 0) {
      console.log(`First framework: ${frameworks.available_frameworks[0].name}`);
    }
    
    // Test get_optimized_prompts
    console.log('\n🧪 Testing get_optimized_prompts...');
    const prompts = await server.get_optimized_prompts({
      task_type: 'feature_prioritization'
    });
    
    console.log(`✅ Found ${prompts.total_count} prompts for feature prioritization`);
    if (prompts.available_prompts.length > 0) {
      console.log(`First prompt: ${prompts.available_prompts[0].name}`);
    }
    
    console.log('\n🎉 MCP Server test completed successfully!');
    
  } catch (error) {
    console.error('❌ MCP Server test failed:', error.message);
    
    if (error.message.includes('relation "frameworks" does not exist')) {
      console.log('\n📝 Next steps:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Click "SQL Editor"');
      console.log('3. Run the SQL from: supabase/migrations/001_initial_schema.sql');
      console.log('4. Then run: supabase/seed.sql');
    }
  }
}

testMCPServer();