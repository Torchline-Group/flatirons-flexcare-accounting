#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Expected: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Read CSV file
const csvPath = path.join(__dirname, '../../../Downloads/Flatirons Flexcare/All-Transactions-Register-.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`❌ CSV file not found: ${csvPath}`);
  process.exit(1);
}

console.log('📂 Reading CSV file...');
const fileContent = fs.readFileSync(csvPath, 'utf-8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  async complete(results) {
    try {
      console.log(`📊 Parsed ${results.data.length} transactions`);

      // Filter for dates between 10/2025 and 5/8/2026
      const filtered = results.data.filter(row => {
        if (!row.Date) return false;
        const [month, day, year] = row.Date.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const startDate = new Date(2025, 9, 1); // Oct 1, 2025
        const endDate = new Date(2026, 4, 9); // May 9, 2026
        return date >= startDate && date <= endDate;
      });

      console.log(`✅ Filtered to ${filtered.length} transactions in date range (10/2025 - 5/8/2026)`);

      if (filtered.length === 0) {
        console.warn('⚠️  No transactions found in the date range');
        process.exit(0);
      }

      // Transform data
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
      console.log(`📤 Inserting ${transactions.length} transactions...`);

      // Insert in batches to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        const { error } = await supabase
          .from('transactions')
          .insert(batch);

        if (error) {
          console.error(`❌ Error uploading batch ${Math.floor(i / batchSize) + 1}:`, error.message);
          throw error;
        }

        console.log(`✓ Uploaded batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`);
      }

      console.log('✨ Successfully uploaded all transactions!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message || err);
      process.exit(1);
    }
  },
  error(err) {
    console.error('❌ CSV parsing error:', err);
    process.exit(1);
  }
});
