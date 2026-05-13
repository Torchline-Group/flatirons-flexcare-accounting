# 🚀 Vercel Deployment Guide - 5 Minutes to Live!

## Why Vercel?
✅ **Easiest**: One-click deployment  
✅ **Fast**: Auto-optimized for Next.js  
✅ **Secure**: Built-in environment variable management  
✅ **Free**: Generous free tier  
✅ **Scalable**: Handles growth automatically  

## Step-by-Step Deployment

### Step 1: Prepare Your Code
```bash
# Make sure everything is committed
git add .
git commit -m "feat: add Stripe + Melio accounting dashboard"
git push origin main
```

### Step 2: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" (easiest: sign in with GitHub)
3. Authorize GitHub access

### Step 3: Create New Project
1. Click "New Project" (top right)
2. Select your GitHub repo
3. Vercel auto-detects it's a Next.js project ✓

### Step 4: Add Environment Variables
1. Click "Environment Variables"
2. Add these variables:

```
NEXT_PUBLIC_STRIPE_KEY = pk_live_your_key_here
STRIPE_SECRET_KEY = sk_live_your_key_here
NEXT_PUBLIC_MELIO_KEY = melio_pk_your_key_here
MELIO_SECRET_KEY = melio_sk_your_key_here
```

**⚠️ IMPORTANT**: Copy these from your Stripe & Melio dashboards

### Step 5: Deploy!
1. Click "Deploy" button
2. Wait ~2 minutes ⏳
3. Get your URL: `https://your-project.vercel.app` 🎉

## Connecting Stripe & Melio

### Stripe Setup (5 mins)
1. Go to [stripe.com](https://stripe.com)
2. Create account → Business info
3. Go to Settings → API Keys
4. Copy **Publishable Key** → `NEXT_PUBLIC_STRIPE_KEY`
5. Copy **Secret Key** → `STRIPE_SECRET_KEY`
6. Enable ACH Transfers in Settings → Financial Connections

### Melio Setup (5 mins)
1. Go to [melio.com](https://melio.com)
2. Sign up for business account
3. Complete verification (ID upload)
4. Go to Settings → API Keys
5. Copy **Public Key** → `NEXT_PUBLIC_MELIO_KEY`
6. Copy **Secret Key** → `MELIO_SECRET_KEY`

## Testing Your Deployment

### Test the Dashboard
1. Visit your Vercel URL
2. Try uploading a test CSV
3. Check transactions display correctly

### Test Stripe (Demo Mode)
1. Go to Settings tab
2. Click "Connect Stripe"
3. Use test card: `4242 4242 4242 4242`

### Test Melio (Demo Mode)
1. Go to Settings tab
2. Click "Connect Melio"
3. Use Melio sandbox for testing

## Updating Your App

### Make Changes Locally
```bash
# Edit code
nano app/page.tsx

# Commit changes
git add .
git commit -m "Update dashboard styling"
git push origin main
```

**Vercel automatically redeploys!** ✨

### View Deployment Status
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. See deployment history and logs

## Custom Domain (Optional)

1. Go to project Settings → Domains
2. Enter your domain (e.g., `accounting.mycompany.com`)
3. Add DNS records (Vercel provides instructions)
4. DNS propagates in ~24 hours

## Troubleshooting

### "API Keys Not Found"
- Check `.env.local` file was NOT committed
- Add keys in Vercel Settings → Environment Variables
- Redeploy after adding variables

### "Stripe Connection Failed"
- Verify keys in Vercel dashboard
- Make sure test/live mode matches
- Check Stripe account is verified

### "Page shows 404"
- Verify Next.js file is at `app/page.tsx`
- Check build logs in Vercel
- Ensure no TypeScript errors

### "Environment variables not loading"
- Redeploy after adding variables
- Hard refresh (Ctrl+Shift+R)
- Check Vercel build logs

## Security Checklist

- [ ] Never commit `.env.local`
- [ ] Use live Stripe/Melio keys in production
- [ ] Enable CORS on API routes
- [ ] Add rate limiting
- [ ] Monitor costs in Stripe/Melio dashboards
- [ ] Enable 2FA on all accounts

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Connect Stripe & Melio
3. ✅ Upload test CSV
4. ✅ Make a test transfer
5. ✅ Share URL with your team
6. ✅ Monitor transactions

## Support

- **Vercel Issues**: https://vercel.com/support
- **Stripe Issues**: https://support.stripe.com
- **Melio Issues**: https://melio.com/help
- **GitHub**: Create an issue in your repo

---

**Your app is live!** Share the Vercel URL and start processing payments. 🎉
