// ============================================
// API Route Examples - Add these to your Next.js app
// File: app/api/stripe/create-payment-intent.ts
// ============================================

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { amount, description } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert dollars to cents
      currency: 'usd',
      description: description || 'FlexCare Payment',
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// File: app/api/stripe/create-ach-transfer.ts
// ============================================

export async function POST(req: Request) {
  try {
    const { amount, bankAccountToken, description } = await req.json();

    if (!amount || !bankAccountToken) {
      return Response.json(
        { error: 'Amount and bank account token required' },
        { status: 400 }
      );
    }

    // In production, use Stripe Treasury or Financial Connections
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      method: 'instant',
      destination: bankAccountToken,
      description: description || 'ACH Transfer',
    });

    return Response.json({
      id: payout.id,
      status: payout.status,
      amount: payout.amount / 100,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// File: app/api/melio/send-payment.ts
// ============================================

export async function POST(req: Request) {
  try {
    const { vendorId, amount, description, scheduledDate } = await req.json();

    if (!vendorId || !amount) {
      return Response.json(
        { error: 'Vendor ID and amount required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.melio.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MELIO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendor_id: vendorId,
        amount: amount * 100, // Convert to cents
        description: description || 'Payment via FlexCare',
        method: 'ach', // Options: 'ach', 'check', 'wire'
        scheduled_date: scheduledDate || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Melio API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Response.json({
      id: data.id,
      status: data.status,
      amount: data.amount / 100,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// File: app/api/melio/get-vendors.ts
// ============================================

export async function GET(req: Request) {
  try {
    const response = await fetch('https://api.melio.com/v1/vendors', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MELIO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Melio API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// File: app/api/stripe/plaid-link-token.ts
// For linking bank accounts via Plaid
// ============================================

export async function GET(req: Request) {
  try {
    // Use @stripe/stripe-js to create Plaid Link token
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Create financial connections session
    const session = await stripe.connections.createSession({
      account_holder: {
        type: 'business',
      },
      permissions: ['balances', 'ownership', 'transactions'],
      filters: {
        countries: ['US'],
      },
    });

    return Response.json({
      clientSecret: session.client_secret,
      id: session.id,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// How to use these routes in your component:
// ============================================

/*

// Example: Create Stripe payment
async function handleStripePayment() {
  const response = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 100,
      description: 'Invoice #12345',
    }),
  });

  const { clientSecret } = await response.json();
  // Pass clientSecret to Stripe Elements or Payment Element
}

// Example: Send Melio payment
async function handleMelioPayment() {
  const response = await fetch('/api/melio/send-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vendorId: 'vendor_123',
      amount: 500,
      description: 'Invoice #67890',
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    }),
  });

  const { id, status } = await response.json();
  console.log(`Payment ${id} - Status: ${status}`);
}

// Example: Get Melio vendors
async function loadVendors() {
  const response = await fetch('/api/melio/get-vendors');
  const vendors = await response.json();
  console.log('Available vendors:', vendors);
}

*/

// ============================================
// Installation & Setup
// ============================================

/*

1. Install Stripe SDK:
   npm install stripe @stripe/react-stripe-js @stripe/stripe-js

2. Create folder structure:
   app/
   ├── api/
   │   ├── stripe/
   │   │   ├── create-payment-intent.ts
   │   │   ├── create-ach-transfer.ts
   │   │   └── plaid-link-token.ts
   │   └── melio/
   │       ├── send-payment.ts
   │       └── get-vendors.ts
   └── page.tsx (enhanced-dashboard.tsx)

3. Add environment variables to .env.local:
   STRIPE_SECRET_KEY=sk_live_xxx
   MELIO_SECRET_KEY=melio_sk_xxx

4. Test locally:
   npm run dev
   Visit http://localhost:3000

5. Deploy to Vercel:
   git push origin main
   Add env vars in Vercel dashboard
   Deploy!

*/
