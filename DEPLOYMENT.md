# Deployment Guide - Investment Advisor v3.3.0

## 📋 Prerequisites

- GitHub account
- Vercel account
- Neon account (for PostgreSQL database)
- Node.js 18+ installed locally

## 🚀 Step 1: Push to GitHub

### Option A: Using GitHub Website

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `InvestmentPortfolio` (or your preferred name)
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
   git remote add origin https://github.com/YOUR_USERNAME/InvestmentPortfolio.git

   # Push to GitHub
   git push -u origin main
   ```

### Option B: Using GitHub CLI (if installed)

```bash
cd "d:\Learn Claude Code\Investment Advisor"
gh repo create InvestmentPortfolio --public --source=. --remote=origin --push
```

## 🌐 Step 2: Create Neon Database (Required)

Neon provides serverless PostgreSQL that works perfectly with Vercel.

1. **Create Neon Account:**
   - Go to https://console.neon.tech/signup
   - Sign up with GitHub or Google (free tier available)

2. **Create a Project:**
   - Click "Create a project"
   - Choose a region (choose closest to your users - e.g., Singapore for Asia)
   - Click "Create project"

3. **Copy Your Database URL:**
   - Neon will show you a connection string like:
   ```
   postgresql://neondb_owner:xxxxx@ep-xxxxx.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   - Copy the **DATABASE_URL** (the pooled version with `pooler` in the host)

## 🔧 Step 3: Push Database Schema to Neon

Before deploying, you need to create the tables in your Neon database:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Link your project:**
   ```bash
   cd "d:\Learn Claude Code\Investment Advisor"
   vercel link
   ```

3. **Push the schema:**
   ```bash
   DATABASE_URL="your_neon_database_url_here" npx prisma db push
   ```

   This will create all tables (User, Portfolio, Favorite, etc.) in your Neon database.

## 🚀 Step 4: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel:**
   - Visit https://vercel.com/new
   - Sign in with your GitHub account

2. **Import Your Repository:**
   - Click "Add New..." → "Project"
   - Select your `InvestmentPortfolio` repository from GitHub
   - Click "Import"

3. **Configure Project:**

   **Project Settings:**
   - **Name:** `investment-advisor` (or your preferred name)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)

   **Environment Variables** (Click "Add New" for each):

   ```env
   # Required
   DATABASE_URL=postgresql://neondb_owner:xxxxx@ep-xxxxx-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=generate-at-https://generate-secret.vercel.app/32

   # Optional (Free tiers work without these)
   FINNHUB_API_KEY=your_finnhub_api_key
   COINGECKO_API_KEY=your_coingecko_api_key
   ```

4. **Generate NEXTAUTH_SECRET:**
   - Go to https://generate-secret.vercel.app/32
   - Copy the generated secret

5. **Click "Deploy"**
   - Wait for deployment to complete (~2-3 minutes)
   - Your app will be available at `https://your-app-name.vercel.app`

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

## ✅ Step 5: Verify Deployment

1. **Visit your deployed app:**
   - `https://your-app-name.vercel.app`

2. **Test key features:**
   - [ ] Sign up as new user (first user automatically becomes admin)
   - [ ] Login with created account
   - [ ] Add portfolio position
   - [ ] Access admin panel (click avatar → Admin Panel)
   - [ ] Test real-time prices
   - [ ] Verify optional fields can be left blank

## 👑 Step 6: Access Admin Panel

After signing up (as the first user), you automatically become admin:

1. **Sign in** to your account
2. **Click your avatar/name** in the top-right
3. **Select "Admin Panel"** from the dropdown
4. Or go directly to: `https://your-app.vercel.app/admin`

**Admin Features:**
- View all registered users
- Click any user to see their details
- Reset user passwords (with CAPTCHA verification)
- View and delete user portfolios
- Export database

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

## 🆕 Updating Your App

### Auto-Deploy (Recommended)

1. Push changes to GitHub `main` branch:
   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```

2. Vercel automatically deploys!

### Manual Deploy

```bash
vercel --prod
```

## 🐛 Troubleshooting

### Common Build Errors

**Issue:** `TypeError: expected string, received null`
- **Fix:** This is fixed in v3.3.0 - optional fields now properly handle null values

**Issue:** Prisma schema validation error
- **Fix:** Make sure Prisma schema uses `postgresql` provider

**Issue:** `prisma generate` fails during build
- **Fix:** Ensure `DATABASE_URL` is correctly set in Vercel environment variables

**Issue:** NextAuth errors
- **Fix:** Ensure `NEXTAUTH_URL` matches your Vercel domain exactly (include https://)

### Runtime Errors

**Issue:** Database connection errors
- **Fix:** Check Neon database is accepting connections from anywhere (no IP restrictions)

**Issue:** Can't sign up on deployed app
- **Fix:** Make sure database tables were created with `npx prisma db push`

**Issue:** Staying logged in after closing browser
- **Note:** This is expected behavior! Sessions persist for 30 days
- **Important:** When you share the app URL, others see their OWN login screen, not your account

## 🔒 Security Checklist

- [ ] Strong `NEXTAUTH_SECRET` (32+ random characters)
- [ ] Neon PostgreSQL database (not SQLite for production)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables set in Vercel (not in .env file)
- [ ] `.gitignore` excludes sensitive files (.env, .env.local, etc.)
- [ ] First user is admin (automatic)
- [ ] Database tables created via `prisma db push`

## 📊 Database Management

### Access Neon Database

1. **Go to Neon Console:**
   - https://console.neon.tech
   - Select your project
   - Click "SQL Editor" to run queries

2. **Common Queries:**
   ```sql
   -- View all users
   SELECT * FROM "User";

   -- Make a user admin
   UPDATE "User" SET "isAdmin" = true WHERE email = 'user@example.com';

   -- View recent signups
   SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 10;
   ```

### Reset Database (Caution!)

If you need to reset your production database:

1. **In Neon Console:**
   - Go to your project
   - Click "Reset database" (deletes all data!)

2. **Re-run schema push:**
   ```bash
   DATABASE_URL="your_neon_url" npx prisma db push
   ```

## 📞 Support

For issues:
- GitHub Issues: https://github.com/YOUR_USERNAME/InvestmentPortfolio/issues
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs

## 🎯 Quick Reference

**Environment Variables Needed:**
```env
DATABASE_URL=postgresql://... (from Neon)
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Admin Access:**
- First user who signs up = Admin
- Access via avatar dropdown → Admin Panel
- Or go to `/admin` directly

**Session Security:**
- Sessions persist for 30 days in browser cookies
- Each browser/device has separate sessions
- Safe to share app URL - others see their own login

---

**Built with ❤️ and deployed on Vercel with Neon PostgreSQL**
