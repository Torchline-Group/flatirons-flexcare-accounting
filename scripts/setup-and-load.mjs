#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/)?.[1];
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Step 1: Create table
console.log('📋 Creating transactions table...');

const createTableSQL = `
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
`;

// Try to create table using raw SQL endpoint
const createResponse = await fetch(
  `${supabaseUrl}/rest/v1/rpc/exec_raw_sql`,
  {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql: createTableSQL })
  }
).catch(e => ({ ok: false, error: e }));

if (!createResponse.ok) {
  console.log('⚠️  Could not create table via RPC (may already exist)');
} else {
  console.log('✅ Table created');
}

// Step 2: Load data
console.log('\n📂 Reading CSV...');
const csvPath = path.join(__dirname, '../../Downloads/Flatirons Flexcare/All-Transactions-Register-.csv');

const fileContent = fs.readFileSync(csvPath, 'utf-8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  async complete(results) {
    try {
      console.log(`📊 Parsed ${results.data.length} transactions`);

      const filtered = results.data.filter(row => {
        if (!row.Date) return false;
        const [month, day, year] = row.Date.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const startDate = new Date(2025, 9, 1);
        const endDate = new Date(2026, 4, 9);
        return date >= startDate && date <= endDate;
      });

      console.log(`✅ ${filtered.length} transactions in range`);

      const transactions = filtered.map(row => {
        const [month, day, year] = row.Date.split('/').map(Number);
        return {
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          ref_no: row['Ref No.'] || null,
          payee: row.Payee || 'Unknown',
          memo: row.Memo || null,
          payment: row.Payment ? parseFloat(row.Payment.replace(/,/g, '')) : 0,
          deposit: row.Deposit ? parseFloat(row.Deposit.replace(/,/g, '')) : 0,
          reconciliation_status: row['Reconciliation Status'] || null,
          balance: row.Balance ? parseFloat(row.Balance.replace(/,/g, '')) : 0,
          type: row.Type || null,
          account: row.Account || null,
          added_in_banking: row['Added in Banking'] || null
        };
      });

      console.log('🔄 Uploading to Supabase...');

      const batchSize = 50;
      let uploaded = 0;

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);

        const response = await fetch(
          `${supabaseUrl}/rest/v1/transactions`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(batch)
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error(`❌ Batch error:`, error);
          throw new Error(`Batch failed: ${error}`);
        }

        uploaded += batch.length;
        console.log(`✓ Uploaded ${uploaded}/${transactions.length} records`);
      }

      console.log('\n✨ Success! All transactions loaded to Supabase');
      console.log(`📊 Total: ${uploaded} transactions from 10/2025 to 5/8/2026`);
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  }
});
