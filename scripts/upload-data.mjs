#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read env
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/)?.[1];
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const csvPath = path.join(__dirname, '../../Downloads/Flatirons Flexcare/All-Transactions-Register-.csv');

console.log('📂 Reading CSV...');
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

      console.log(`✅ ${filtered.length} transactions in range (10/2025 - 5/8/2026)`);

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

      console.log('🔄 Uploading to Supabase via REST API...');

      const restUrl = `${supabaseUrl}/rest/v1/bookkeeping_transactions`;
      const batchSize = 50;

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);

        const response = await fetch(restUrl, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(batch)
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
          throw new Error(`Upload failed: ${error}`);
        }

        console.log(`✓ Batch ${Math.floor(i / batchSize) + 1} uploaded (${batch.length} records)`);
      }

      console.log('✨ All transactions uploaded successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  }
});
