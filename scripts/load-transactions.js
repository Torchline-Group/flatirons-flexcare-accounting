#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('papaparse');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const csvPath = path.join(__dirname, '../../../Downloads/Flatirons Flexcare/All-Transactions-Register-.csv');

console.log('📂 Reading CSV file:', csvPath);

const fileContent = fs.readFileSync(csvPath, 'utf-8');

csv.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  async complete(results) {
    console.log(`📊 Parsed ${results.data.length} transactions`);

    // Filter for dates between 10/2025 and 5/8/2026
    const filtered = results.data.filter(row => {
      const date = new Date(row.Date);
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2026-05-09');
      return date >= startDate && date <= endDate;
    });

    console.log(`✅ Filtered to ${filtered.data.length} transactions in date range`);

    // Transform data
    const transactions = filtered.map(row => ({
      date: row.Date,
      ref_no: row['Ref No.'] || null,
      payee: row.Payee,
      memo: row.Memo,
      payment: row.Payment ? parseFloat(row.Payment.replace(/,/g, '')) : 0,
      deposit: row.Deposit ? parseFloat(row.Deposit.replace(/,/g, '')) : 0,
      reconciliation_status: row['Reconciliation Status'],
      balance: row.Balance ? parseFloat(row.Balance.replace(/,/g, '')) : 0,
      type: row.Type,
      account: row.Account,
      added_in_banking: row['Added in Banking']
    }));

    console.log('🔄 Uploading to Supabase...');

    const { error } = await supabase
      .from('transactions')
      .insert(transactions);

    if (error) {
      console.error('❌ Error uploading transactions:', error.message);
      process.exit(1);
    }

    console.log('✨ Successfully uploaded all transactions!');
  },
  error(err) {
    console.error('CSV parsing error:', err);
    process.exit(1);
  }
});
