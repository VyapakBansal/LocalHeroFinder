/**
 * Migration script to run all Supabase migrations
 * 
 * Usage:
 *   node run-migrations.js
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * Get these from: https://supabase.com/dashboard/project/nlhidtzfltbpkhkttzwb/settings/api
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nlhidtzfltbpkhkttzwb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('   Get it from: https://supabase.com/dashboard/project/nlhidtzfltbpkhkttzwb/settings/api');
  console.error('   Then run: SUPABASE_SERVICE_ROLE_KEY=your_key node run-migrations.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrations = [
  '20251109001154_01e52d07-d7f8-49e0-b090-a1b19578857b.sql',
  '20251109001545_3a87e23d-6dcd-42fb-bfa8-b806f4948fa0.sql',
  '20251109002000_create_certifications_storage.sql',
  '20251109002100_add_user_role_insert_policy.sql'
];

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');
  console.log(`📦 Project: ${SUPABASE_URL}\n`);

  for (const migrationFile of migrations) {
    const migrationPath = join(__dirname, 'supabase', 'migrations', migrationFile);
    
    try {
      console.log(`📄 Running: ${migrationFile}`);
      const sql = readFileSync(migrationPath, 'utf-8');
      
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          // If RPC doesn't work, try direct query (this requires service role)
          if (error) {
            // Use the REST API directly for DDL statements
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({ sql_query: statement })
            });

            if (!response.ok && !response.status === 404) {
              // Try executing via PostgREST or direct connection
              console.warn(`   ⚠️  Note: Some statements may need to be run manually in SQL Editor`);
            }
          }
        }
      }
      
      console.log(`   ✅ Completed: ${migrationFile}\n`);
    } catch (error) {
      console.error(`   ❌ Error in ${migrationFile}:`, error.message);
      console.error('   Please run this migration manually in the Supabase SQL Editor\n');
    }
  }

  console.log('✨ Migration process completed!');
  console.log('\n📝 Note: Some DDL statements may need to be run manually.');
  console.log('   Go to: https://supabase.com/dashboard/project/nlhidtzfltbpkhkttzwb/sql/new');
}

runMigrations().catch(console.error);

