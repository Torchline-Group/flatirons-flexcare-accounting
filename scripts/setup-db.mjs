#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Setting up transactions table...');

// Create table using RPC or raw query
const { error } = await supabase.rpc('exec_sql', {
  sql: `
    CREATE TABLE IF NOT EXISTS transactions (
      id BIGSERIAL PRIMARY KEY,
      date DATE NOT NULL,
      ref_no VARCHAR(50),
      payee VARCHAR(255) NOT NULL,
      memo TEXT,
      payment DECIMAL(15, 2) DEFAULT 0,
      deposit DECIMAL(15, 2) DEFAULT 0,
      reconciliation_status VARCHAR(50),
      balance DECIMAL(15, 2),
      type VARCHAR(50),
      account VARCHAR(255),
      added_in_banking VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions(payee);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account);
  `
});

if (error && error.message !== 'relation "transactions" already exists') {
  console.error('⚠️  Note: Table might already exist or RPC not available');
  console.log('💡 You may need to create the table manually in Supabase dashboard');
} else {
  console.log('✅ Table created successfully');
}
