# Deployment Guide - Investment Advisor v3.2.0

## 📋 Prerequisites

- GitHub account
- Vercel account
- Node.js 18+ installed locally

## 🚀 Step 1: Push to GitHub

### Option A: Using GitHub Website

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `investment-advisor` (or your preferred name)
   - Description: Professional investment portfolio management application
   - Make it **Public** or **Private** (your choice)
   - **DO NOT** initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Push your code to GitHub:**
   ```bash
   cd "d:\Learn Claude Code\Investment Advisor"

   # Rename branch to main (if needed)
   git branch -M main

   # Add remote repository
   git remote add origin https://github.com/YOUR_USERNAME/investment-advisor.git

   # Push to GitHub
   git push -u origin main
   ```

### Option B: Using GitHub CLI (if installed)

```bash
cd "d:\Learn Claude Code\Investment Advisor"
gh repo create investment-advisor --public --source=. --remote=origin --push
```

## 🌐 Step 2: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel:**
   - Visit https://vercel.com/new
   - Sign in with your GitHub account

2. **Import Your Repository:**
   - Click "Add New..." → "Project"
   - Select your `investment-advisor` repository from GitHub
   - Click "Import"

3. **Configure Project:**

   **Project Settings:**
   - **Name:** `investment-advisor` (or your preferred name)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)

   **Environment Variables:**
   Click "Add New" for each variable:

   ```env
   # Required
   DATABASE_URL=postgresql://user:password@host:port/database
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-random-secret-key

   # Optional (Free tiers work without these)
   FINNHUB_API_KEY=your_finnhub_api_key
   COINGECKO_API_KEY=your_coingecko_api_key
   ```

4. **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

5. **Click "Deploy"**
   - Wait for deployment to complete (~2-3 minutes)
   - Your app will be available at `https://investment-advisor.vercel.app`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd "d:\Learn Claude Code\Investment Advisor"
vercel

# Follow the prompts to:
# - Link to existing project or create new
# - Set environment variables
# - Deploy
```

## 🗄️ Step 3: Set Up Production Database

### Option A: Vercel Postgres (Recommended)

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Go to "Storage" tab
   - Click "Create Database"
   - Select "Postgres" → "Continue"

2. **Configure Database:**
   - Region: Choose closest to your users
   - Click "Create"

3. **Connect to Database:**
   - Vercel will automatically add `DATABASE_URL` to your environment variables
   - Click "Deploy" again to apply changes

4. **Run Migrations:**
   ```bash
   # In your project directory
   npx prisma generate
   npx prisma db push
   ```

### Option B: Supabase (Free Alternative)

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Sign up and create a new project
   - Wait for database to be ready

2. **Get Connection String:**
   - Go to Settings → Database
   - Copy the "Connection string" (URI format)
   - Replace `[YOUR-PASSWORD]` with your database password

3. **Add to Vercel:**
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Option C: Neon (Serverless Postgres)

1. **Create Neon Project:**
   - Go to https://neon.tech
   - Sign up and create a project
   - Copy the connection string

2. **Add to Vercel:**
   ```
   DATABASE_URL=postgresql://[user]:[password]@[neon-host]/[database]
   ```

## 🔐 Step 4: Configure NextAuth

1. **Add Environment Variables in Vercel:**
   ```env
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-random-secret-key
   ```

2. **Get your domain:**
   - After deployment, Vercel will show your domain
   - Use this exact URL for `NEXTAUTH_URL`

## 📧 Step 5: Configure Email (Optional)

For email verification, add these environment variables:

```env
# For Resend (Recommended - Free tier available)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Or for SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

## ✅ Step 6: Verify Deployment

1. **Visit your deployed app:**
   - `https://investment-advisor.vercel.app`

2. **Test key features:**
   - [ ] Sign up as new user (first user becomes admin)
   - [ ] Login with created account
   - [ ] Add portfolio position
   - [ ] Access admin panel (`/admin`)
   - [ ] Test real-time prices
   - [ ] Check all pages load correctly

## 🔄 Step 7: Set Up Custom Domain (Optional)

1. **In Vercel Dashboard:**
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `app.yourdomain.com`)

2. **Update DNS:**
   - Follow Vercel's DNS configuration instructions
   - Add A record or CNAME as shown

3. **Wait for propagation:**
   - Usually takes a few minutes to a few hours

## 📊 Monitoring & Analytics

### Vercel Analytics

Automatically enabled. View in Vercel Dashboard:
- Page views
- Unique visitors
- Core Web Vitals

### Error Tracking

Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay

## 🆕 Updating Your App

### Method 1: Auto-Deploy (Recommended)

1. Push changes to GitHub `main` branch:
   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```

2. Vercel automatically deploys!

### Method 2: Manual Deploy

```bash
vercel --prod
```

## 🐛 Troubleshooting

### Build Errors

**Issue:** `prisma generate` fails
- **Fix:** Make sure `DATABASE_URL` is correctly set in Vercel

**Issue:** NextAuth errors
- **Fix:** Ensure `NEXTAUTH_URL` matches your Vercel domain exactly

### Runtime Errors

**Issue:** Database connection errors
- **Fix:** Check database is accepting connections from Vercel's IP ranges

**Issue:** API rate limits
- **Fix:** Add your own API keys for Finnhub, CoinGecko, etc.

## 📦 Database Migration

To migrate existing local data to production:

```bash
# Export local data
npx prisma studio
# Then manually export or use the admin export feature

# Or use admin API (after logging in):
# GET /api/admin/export-database
```

## 🔒 Security Checklist

- [ ] Strong `NEXTAUTH_SECRET` (32+ random characters)
- [ ] Production database (not SQLite)
- [ ] HTTPS enabled
- [ ] Environment variables are not in `.env` file
- [ ] `.gitignore` excludes sensitive files
- [ ] API keys are rotated regularly
- [ ] Database backups are enabled

## 📞 Support

For issues:
- GitHub Issues: https://github.com/YOUR_USERNAME/investment-advisor/issues
- Vercel Docs: https://vercel.com/docs

---

**Built with ❤️ and deployed on Vercel**
