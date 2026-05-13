# Flatirons FlexCare Accounting Dashboard - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install papaparse @stripe/react-stripe-js @stripe/stripe-js
```

### 2. Set Up Environment Variables
Create a `.env.local` file in your project root:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY

# Melio Configuration
NEXT_PUBLIC_MELIO_KEY=melio_pk_YOUR_MELIO_PUBLIC_KEY
MELIO_SECRET_KEY=melio_sk_YOUR_MELIO_SECRET_KEY
```

### 3. Get Your API Keys

#### Stripe:
1. Go to [stripe.com](https://stripe.com) and create an account
2. Navigate to Settings → API Keys
3. Copy your publishable and secret keys
4. Use live keys for production

#### Melio:
1. Go to [melio.com](https://melio.com) and create a business account
2. Navigate to Settings → API Keys
3. Copy your API keys
4. Enable bill pay and ACH transfers in your account settings

### 4. Create API Routes (Next.js)
Create these files in `app/api/`:

#### `app/api/stripe/create-payment-intent.ts`
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { amount, description } = await req.json();
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description,
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

#### `app/api/melio/send-payment.ts`
```typescript
export async function POST(req: Request) {
  const { vendorId, amount, description } = await req.json();

  try {
    const response = await fetch('https://api.melio.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MELIO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendor_id: vendorId,
        amount,
        description,
        method: 'ach', // or 'check' or 'wire'
      }),
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### 5. Update Your Component
Replace your existing component with `enhanced-dashboard.tsx`:

```bash
# Copy the enhanced dashboard
mv enhanced-dashboard.tsx app/page.tsx
```

### 6. Deploy to Vercel (Easiest!)

#### Option A: Deploy from GitHub (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" → Connect your GitHub repo
4. Add environment variables in Settings → Environment Variables
5. Click Deploy ✨

#### Option B: Deploy via CLI
```bash
npm install -g vercel
vercel --prod
# Follow prompts and add env vars when asked
```

## 📋 Features

### Dashboard Tab
- 📊 Upload CSV bank statements
- 💰 View total deposits, payments, and net income
- 🏦 See breakdown by account
- 📈 Real-time calculations

### Transfers Tab
- 💸 Send money via Stripe or Melio
- 📥 Receive payments via Stripe
- 🏦 Manage linked bank accounts
- 📋 Track transfer history and status

### Settings Tab
- 🔵 Connect Stripe (Payment collection + ACH)
- 🟠 Connect Melio (Bill payments)
- 🔑 View API configuration instructions

## 🔗 Integration Details

### Stripe Integration
- **Payment Collection**: Accept payments from customers
- **ACH Transfers**: Send and receive money via ACH
- **Plaid**: Link bank accounts for verification
- **Webhooks**: Handle payment status updates

### Melio Integration
- **Bill Pay**: Pay vendors and contractors
- **ACH Transfers**: Direct transfers to bank accounts
- **Invoice Management**: Automated invoice tracking
- **Scheduled Payments**: Schedule payments for future dates

## 🛡️ Security Best Practices

1. **Never commit `.env.local` to git**
   ```bash
   # Add to .gitignore
   .env.local
   .env.*.local
   ```

2. **Use production keys only in production**
   - Test with Stripe test keys first
   - Switch to live keys for production

3. **Validate on backend**
   - Never trust client-side validation
   - Always verify amounts and recipients on server

4. **Use CORS headers**
   - Only allow requests from your domain
   - Implement rate limiting

## 🧪 Testing

### Test Stripe Payments
- Use test card: `4242 4242 4242 4242`
- Expiry: `12/25` (future date)
- CVC: `123`

### Test Melio Transfers
- Contact Melio support for sandbox environment
- Use test vendor accounts for development

## 📚 Documentation Links

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe ACH Transfers](https://stripe.com/docs/payments/ach-debits)
- [Melio API Docs](https://docs.melio.com)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Vercel Deployment](https://vercel.com/docs)

## 🆘 Troubleshooting

### "API key not found"
- Check `.env.local` file exists and has correct keys
- Restart dev server after adding env vars

### Stripe connection fails
- Verify keys are from same account
- Check test vs. live mode
- Ensure Stripe account is verified

### Melio payment rejected
- Verify vendor is properly registered
- Check bank account routing number
- Ensure amount is within limits

## 📞 Support

- Stripe Support: [support.stripe.com](https://support.stripe.com)
- Melio Support: [melio.com/help](https://melio.com/help)
- Vercel Support: [vercel.com/help](https://vercel.com/help)

---

**Ready to deploy?** Follow the Vercel deployment steps above and your dashboard will be live in minutes! 🚀
