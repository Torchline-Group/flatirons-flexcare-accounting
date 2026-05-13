#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/)?.[1];
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"/)?.[1];

const response = await fetch(
  `${supabaseUrl}/rest/v1/rpc/get_table_schema?table_name=bookkeeping_transactions`,
  {
    headers: { 'apikey': supabaseKey }
  }
).catch(() => null);

if (response?.ok) {
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log('Could not fetch schema via RPC. Trying information_schema...');

  const infoResponse = await fetch(
    `${supabaseUrl}/rest/v1/information_schema_columns?table_name=eq.bookkeeping_transactions`,
    {
      headers: { 'apikey': supabaseKey }
    }
  );

  if (infoResponse.ok) {
    const columns = await infoResponse.json();
    console.log('Columns in bookkeeping_transactions:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
  } else {
    console.log('Please check your Supabase dashboard to see the table structure');
  }
}
