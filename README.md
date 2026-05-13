# 🏢 Flatirons FlexCare Accounting Dashboard

A modern, professional accounting dashboard for small businesses with integrated payment processing and ACH transfer capabilities.

## ✨ Features

### 📊 Transaction Management
- Upload CSV bank statements
- Auto-parse transactions (payments, deposits, balances)
- View totals by account
- Real-time financial summaries

### 💳 Payment Processing
- **Stripe**: Accept payments, process ACH transfers, collect invoices
- **Melio**: Pay vendors, send ACH transfers, automate bill pay
- Dual processor support for maximum flexibility

### 🏦 Bank Integration
- Link bank accounts via Plaid (through Stripe)
- Manage multiple accounts
- Real-time balance tracking

### 💸 Transfer Management
- Send and receive ACH transfers
- Track transfer status (pending, completed, failed)
- Full transaction history
- Choose processor per transfer

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Stripe account (for payments & ACH)
- Melio account (for bill pay)

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
Dashboard Project/
├── enhanced-dashboard.tsx        # Main React component (UPDATED)
├── stripe-melio-setup.ts         # API helper functions
├── package.json                  # Dependencies
├── SETUP_INSTRUCTIONS.md         # Detailed setup guide
└── README.md                     # This file
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_STRIPE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_MELIO_KEY=melio_pk_xxx
MELIO_SECRET_KEY=melio_sk_xxx
```

See `SETUP_INSTRUCTIONS.md` for detailed setup.

## 📚 Usage

### Upload Transactions
1. Go to **Dashboard** tab
2. Click the upload area or drag & drop CSV
3. View instant calculations
4. See breakdown by account

### Make Transfers
1. Go to **Transfers** tab
2. Select transfer type (Send/Receive)
3. Choose processor (Stripe or Melio)
4. Enter amount and recipient
5. Click to initiate transfer

### Connect Payment Processors
1. Go to **Settings** tab
2. Click "Connect Stripe" or "Connect Melio"
3. Follow OAuth flow
4. Authorize and connect

## 🎨 UI/UX

- **Modern Design**: Clean, professional layout with intuitive tabs
- **Responsive**: Works on desktop, tablet, and mobile
- **Color Coded**: Green for income, red for expenses, blue for primary actions
- **Real-time Updates**: Instant calculations and status tracking
- **Accessibility**: Proper labels, readable fonts, high contrast

## 🔐 Security

- ✅ No secrets in frontend code
- ✅ All API calls signed with server keys
- ✅ Environment variables protected
- ✅ Never commit `.env.local`
- ✅ CORS headers on all endpoints
- ✅ Rate limiting recommended

## 🚀 Deployment

### Vercel (Recommended - Easiest!)
```bash
# 1. Push to GitHub
git push origin main

# 2. Go to vercel.com → New Project
# 3. Connect your GitHub repo
# 4. Add environment variables
# 5. Deploy!
```

**Deployed:** Your app is live at `your-app.vercel.app` ✨

### Other Options
- **Netlify**: Similar to Vercel
- **Dokploy**: Self-hosted (more complex)
- **DigitalOcean App Platform**: Simple deployment

See `SETUP_INSTRUCTIONS.md` for deployment details.

## 📞 Support & Documentation

- **Stripe Docs**: https://stripe.com/docs
- **Melio Docs**: https://docs.melio.com
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs

## 💡 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Create `.env.local` with API keys
3. ✅ Start dev server: `npm run dev`
4. ✅ Test locally at `localhost:3000`
5. ✅ Deploy to Vercel (see SETUP_INSTRUCTIONS.md)

## 📝 License

MIT - Feel free to use for your business needs.

---

**Made for Flatirons FlexCare Accounting** | Built with React, Next.js, Stripe & Melio
