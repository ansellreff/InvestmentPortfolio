# 💼 Investment Advisor

A professional-grade SaaS web application for comparing investment instruments including gold, stocks, crypto, and other assets with real-time data, technical analysis, AI-powered forecasting, and user account management.

![Version](https://img.shields.io/badge/version-3.3.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🆕 What's New in v3.3

### 🔐 Authentication & Security Improvements
- **Password Visibility Toggle**: Eye icon to show/hide password on all auth forms
- **Admin Password Reset**: Admins can reset any user's password via admin panel (with CAPTCHA verification)
- **Math CAPTCHA**: Simple 2-step verification for admin password reset
- **Removed Email Verification**: Simplified signup - no email verification required
- **Fixed Optional Fields**: Properly handles empty optional fields (date of birth, phone, location)

### 🚀 Deployment & Database
- **Neon PostgreSQL Integration**: Production-ready PostgreSQL database via Neon
- **Vercel Deployment**: Optimized for Vercel with auto-deployment from GitHub
- **Database Schema**: Migrated from SQLite (dev) to PostgreSQL (production)
- **Environment Configuration**: Proper setup for Vercel environment variables

### 🐛 Bug Fixes
- **Fixed Signup Validation**: Optional fields now properly accept null/empty values
- **Fixed TypeScript Build Errors**: Resolved Prisma schema issues on Vercel
- **Fixed Session Persistence**: Sessions stay logged in (expected behavior) but are browser-specific

## 🆕 What's New in v3.2

### 🔐 Enhanced Account & Data Management
- **First User Admin Setup**: The first registered user automatically becomes an admin
- **Data Persistence**: All user data is consistently saved and stored in the database
- **Account Isolation**: Each user has a private portfolio accessible only when logged in
- **Cross-Device Sync**: Access your portfolio from any device after login
- **Session Security**: Sessions are browser-specific - sharing the app URL won't share your account

### 👑 Enhanced Admin Panel
- **User Detail Modal**: View comprehensive user information including profile, portfolio, watchlist, and activity
- **Manage User Portfolio**: Admins can view and delete individual portfolio items from user accounts
- **Enhanced User Management**: View user details, edit profiles, and manage access
- **Activity Tracking**: View recent activity logs for any user

### ✏️ Portfolio Editing Improvements
- **Editable Symbol**: Symbol field is now editable when editing positions
- **Search Suggestions**: Autocomplete suggestions appear when editing positions
- **Auto-Close on Delete**: Edit form automatically closes if position is deleted elsewhere
- **Binance LD Prefix Strip**: Automatically strips "LD" prefix from Binance assets (e.g., LDXRP → XRP)

### 📡 Real-Time Price Updates (WebSocket Infrastructure)
- **Live Price Ticker**: Flash animation on price changes
- **WebSocket Support**: Binance WebSocket integration for crypto prices
- **Fallback Polling**: Automatic fallback to 5-second polling for non-WebSocket assets
- **Live Indicators**: Green pulse indicator shows live connection status

## 🆕 What's New in v3.1

### 📊 Market Cap Sorting (Phase 1)
- **Professional Instrument Ordering**: All instruments now sorted by market capitalization instead of random order
- **Crypto**: Sorted by 24h market cap rank (BTC, ETH, USDT at top)
- **US Stocks**: Sorted by company market cap (AAPL, MSFT, GOOGL, NVDA at top)
- **Indonesian Stocks**: Sorted by IDX market cap
- **Metals**: Fixed professional order (Gold > Silver > Platinum > Palladium)

### 📈 Portfolio Performance Analytics (Phase 2)
- **CAGR (Compound Annual Growth Rate)**: Calculate annualized return over time
- **Sharpe Ratio**: Risk-adjusted return metric with rating (Excellent/Good/Fair/Poor)
- **Max Drawdown**: Track maximum portfolio decline from peak
- **Volatility**: Portfolio volatility calculation
- **Benchmark Comparison**: Compare portfolio performance vs S&P 500
- **Performance Charts**: Visual portfolio value history over time
- **Best/Worst Day Tracking**: Identify best and worst performing days
- **Historical Snapshots**: Automatic tracking of portfolio value over time (365-day retention)

### 🔔 Price Alerts & Notifications (Phase 3)
- **Create Alerts**: Set price alerts for any instrument
- **Alert Types**:
  - Price Goes Above/Below target
  - Percentage Change alerts
  - Daily High/Low triggers
- **Alert Management**: View, edit, and delete alerts from dashboard
- **Real-time Notifications**: Get notified when alerts are triggered
- **Alert Status**: Track active, triggered, and expired alerts

### 🔗 Binance Account Integration (Phase 4)
- **Read-Only Access**: Safe API connection that only reads balance data
- **Auto-Sync**: Automatically sync crypto assets from Binance
- **Encrypted Storage**: API keys encrypted with AES-256-CBC
- **Testnet Support**: Test with Binance Testnet before using main account
- **Real-Time Balance**: View live Binance holdings in portfolio
- **USD Value Calculation**: Automatic USD conversion for all assets
- **One-Click Sync**: Manual sync button to refresh balances
- **Secure Disconnect**: Remove connection anytime with data deletion

## ✨ Features

### 🔍 Expanded Instrument Coverage
- **US Stocks**: 90,000+ securities via Finnhub API (NYSE, NASDAQ, AMEX)
  - Real-time quotes with change, change %, high, low, open
  - Historical OHLC data for technical analysis
  - Company profiles and financials
  - ETF and index support
- **Indonesian Stocks**: 700+ IDX-listed companies
  - Dynamic search via Yahoo Finance API
  - Extended local list of top 100 by market cap
  - Multi-source price averaging (Yahoo, Investing.com, IDX.co.id)
- **Cryptocurrencies**: 15,000+ tokens via CoinGecko API
  - Search by symbol or name
  - Trending cryptocurrencies
  - Top coins by market cap
- **Precious Metals**: Gold, Silver, Platinum, Palladium spot prices
  - Real-time pricing from Metals Live API
  - Historical data from Yahoo Finance futures

### 🔍 Unified Search API
- **Multi-Asset Search**: Single endpoint to search all instrument types
- **Type Filtering**: Filter by stock, crypto, ETF, index, or Indonesian stocks
- **Smart Deduplication**: Removes duplicate results across sources
- **Rate Limiting**: Built-in protection against API abuse

### 👤 User Accounts & Authentication
- **Multi-Step Sign Up**: 3-step registration with profile collection
- **Secure Authentication**: NextAuth.js with bcrypt password hashing (12 rounds)
- **Rich Profile Management**: Name, email, phone, location, birth date, bio, website
- **Password Strength Indicator**: Visual feedback during registration
- **Password Visibility Toggle**: Eye icon to show/hide password on all forms
- **Optional Profile Fields**: Date of birth, phone, location are optional
- **User Dashboard**: Personal dashboard with portfolio & watchlist overview
- **Settings Page**: Comprehensive profile, preferences, security, and account management
- **Persistent Data**: All data synced to cloud database
- **Activity Logging**: Track user actions for security
- **Session Management**: Stay logged in across browser restarts (30-day sessions)
- **Browser-Specific Sessions**: Each browser/device has separate sessions - safe to share the app URL

### 📊 Real-Time Price Tracking
- **Gold & Precious Metals**: Real-time spot prices from Metals Live API (~$5,000-$5,200 for gold)
  - Gold (XAU), Silver (XAG), Platinum (XPT), Palladium (XPD)
  - Consistent pricing across all pages using industry-standard spot rates
- **Indonesian Stocks**: Live prices from IDX with multi-source averaging
- **Cryptocurrencies**: Bitcoin, Ethereum, Solana, and more
- **Multi-Currency Support**: USD, NTD, TWD, EUR, IDR, and 30+ currencies with real-time exchange rates
  - Popular currencies: USD, NTD, TWD, EUR
  - Searchable currency list with autocomplete

### 📈 Professional Technical Analysis
- **RSI (Relative Strength Index)**: Identifies overbought/oversold conditions
- **MACD**: Trend momentum indicator with signal crossovers
- **Bollinger Bands**: Volatility-based price channels
- **Moving Averages**: SMA 20, 50, 200 and EMA 12, 26
- **Support & Resistance**: Automatic key level detection
- **Professional Candlestick Charts**: Using lightweight-charts v5

### 🔮 AI-Powered Forecasting
- **30-Day Price Predictions**: Linear regression-based forecasting
- **Trend Analysis**: Bullish/Bearish/Neutral with confidence scores
- **Target Prices**: Projected price targets
- **Stop Loss Levels**: Risk management recommendations

### 📉 Advanced Charts & Visualization
- **Interactive Candlestick Charts**: Professional trading charts with volume
- **Multi-Timeframe**: 1D, 1W, 1M, 3M, 6M, 1Y, 5Y analysis periods
- **Technical Indicators**: RSI, MACD, SMA, EMA, Volume, Bollinger Bands

### 💡 Smart Trading Signals
- **Automated Recommendations**: BUY/SELL/HOLD signals
- **Confidence Scores**: Signal reliability percentage

### 💼 Portfolio Management (Enhanced in v3.2)
- **Track Positions**: Add stocks, crypto, and precious metals
- **Real-time P&L**: Live profit/loss calculations
- **Average Buy Price**: Track your entry points
- **Edit Positions**: Edit symbol, quantity, price, and notes
- **Editable Symbol**: Change the asset symbol when editing (with search suggestions)
- **Delete Protection**: Form auto-closes if position is deleted while editing
- **Cloud Sync**: All changes automatically saved to database

### ⭐ Watchlist
- **Save Favorites**: Add instruments to your watchlist
- **Quick Access**: Fast access to your favorite instruments

### 🎨 User Interface
- **Dark Mode**: Toggle between light, dark, and system themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with shadadcn/ui components
- **Ticker Tape**: Live market overview ticker

## 🛠 Tech Stack

### Frontend
- **Next.js 16.1** - React framework with App Router
- **TypeScript 5.7** - Type-safe development
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Professional UI components
- **Zustand** - State management with localStorage persistence
- **lightweight-charts v5** - Professional candlestick charts

### Backend
- **Next.js API Routes** - Serverless functions
- **NextAuth.js v5** - Authentication
- **Prisma ORM** - Database management
- **SQLite** - Local database (development) / PostgreSQL (production)

### Data Acquisition
- **Finnhub.io** - 90,000+ US stocks, ETFs, and indices (60 calls/min free tier)
- **CoinGecko API** - 15,000+ cryptocurrency prices and market data
- **Metals Live API** - Real-time precious metals spot prices (Gold, Silver, Platinum, Palladium)
- **Yahoo Finance API** - Historical data, Indonesian stocks, market data
- **IDX.co.id** - Official Indonesian stock exchange data
- **open.er-api.com** - Real-time currency exchange rates (30+ currencies)

### Infrastructure
- **Production Logging** - Environment-aware logging system
- **Rate Limiting** - In-memory API rate limiting
- **Error Boundaries** - Graceful error handling
- **API-First Architecture** - Lightweight, no local data storage for instruments

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Steps

1. **Navigate to the project:**
   ```bash
   cd "d:\Learn Claude Code\Investment Advisor"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🚀 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npx prisma studio # Open database browser
```

## 👤 User Account Features

### Creating an Account

1. **Sign Up Flow (3 Steps):**
   - **Step 1 - Account Info**: Name, email, password (with strength indicator)
   - **Step 2 - Profile Details**: Date of birth, phone, location, timezone (optional)
   - **Step 3 - Review**: Confirm information and agree to terms

2. **Password Requirements:**
   - Minimum 8 characters
   - Must contain uppercase and lowercase letters
   - Must contain at least one number

3. **Profile Fields:**
   - Full Name
   - Email Address (used for login)
   - Password
   - Date of Birth
   - Phone Number
   - Location
   - Timezone
   - Bio
   - Website

### Settings Page Features

#### Profile Tab
- Update name, phone, location
- Set date of birth
- Add bio and website
- Profile avatar with initials

#### Preferences Tab
- Default currency selection
- Theme choice (light/dark/system)
- Language selection
- Notification preferences
- Email alert settings

#### Security Tab
- Change password
- View login history
- Current session info

#### Account Tab
- Export all data (JSON format)
- Delete account with confirmation

## 👑 Admin Dashboard & Database Management

### Setting Up Admin Access

**🎉 Automatic Admin Setup (New in v3.2):**
The **first user who registers** on the platform automatically becomes an admin. No manual setup required!

#### Alternative Methods to Set Admin Access

If you need to grant admin access to other users, use one of these methods:

#### Method 1: Using Admin Dashboard (Recommended for Existing Admins)

1. **Login as admin** and navigate to `/admin`
2. **Find the user** in the user management table
3. **Click the Shield icon** to toggle admin status

#### Method 2: Using Prisma Studio

1. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```

2. **Navigate to the User table**

3. **Find your user and toggle the `isAdmin` field to `true`**

4. **Refresh and navigate to `/admin`**

#### Method 3: Direct Database Query

```bash
# Run this in your terminal
npx prisma db execute "UPDATE User SET isAdmin = true WHERE email = 'your-email@example.com';"
```

### Admin Dashboard Features

Navigate to `/admin` after setting up admin access:

#### User Management (Enhanced in v3.2)
- **View All Users**: Paginated list of all registered users
- **Search Users**: Filter by name or email
- **User Details Modal**: Click the eye icon to view detailed user information including:
  - Profile information (name, email, phone, location, bio)
  - Account statistics (portfolios, watchlist, activities count)
  - Full portfolio breakdown with positions
  - Watchlist items
  - Recent activity logs
  - User preferences
  - Email verification status
- **Edit Users**: Modify user information directly
- **Delete Users**: Remove users and all their data
- **Grant/Revoke Admin**: Toggle admin status for any user
- **Delete Portfolio Items**: Remove individual portfolio positions from user accounts

#### Database Statistics
- Total users count
- Total portfolios count
- Total watchlist items
- Total activity logs

#### Export Database
- **Full Export**: Download entire database as JSON
- **Includes**: Users, portfolios, watchlists, preferences, activities

#### Quick Actions
- Open Prisma Studio
- Refresh data
- Export full database

### Admin API Endpoints

```bash
# Check admin status
GET /api/admin/check

# Get all users (admin only)
GET /api/admin/users?page=1&limit=50&search=john

# Get user details (admin only)
GET /api/admin/users/[userId]

# Update user (admin only)
PUT /api/admin/users/[userId]

# Delete user's portfolio item (admin only)
DELETE /api/admin/users/[userId]?portfolioId=portfolio-id

# Get database statistics (admin only)
GET /api/admin/stats

# Set user as admin (admin only)
POST /api/admin/users/set-admin
{
  "userId": "user-id-here",
  "isAdmin": true
}

# Delete user (admin only)
DELETE /api/admin/users?id=user-id-here

# Export full database (admin only)
GET /api/admin/export-database
```

## 🔐 Security & Data Persistence

### Data Persistence
- **Cloud Database**: All user data is stored in Neon PostgreSQL (production)
- **Account Isolation**: Each user has a private portfolio accessible only when logged in
- **Session Management**: Secure JWT-based sessions with 30-day expiration
- **Auto-Sync**: Portfolio changes are automatically synced to the database
- **Cross-Device Access**: Login from any device to access your portfolio
- **Browser-Specific Sessions**: Your login is stored in your browser's cookies only
- **Safe to Share**: When you share the app URL, others see their own login screen, not your account

### How Session Sharing Works
When you share the app URL with a friend:
1. ✅ They see the Sign In / Sign Up page (not your dashboard)
2. ✅ They need their own account to access the app
3. ✅ Your session is private to your browser only
4. ✅ Sessions are stored as HTTP-only cookies (not accessible via JavaScript)

### Security Features
- **Password Hashing**: bcrypt with 12 rounds for secure password storage
- **Rate Limiting**: API rate limiting to prevent abuse (5 attempts per 5 minutes for auth)
- **Input Validation**: All user inputs are validated with Zod schema
- **SQL Injection Protection**: Prisma ORM prevents SQL injection attacks
- **Session Security**: HTTP-only cookies for session tokens
- **Activity Logging**: All user actions are logged for security auditing
- **Admin Password Reset**: CAPTCHA-protected password reset for admins
- **No Email Verification**: Simplified signup without email verification (faster onboarding)

### Protected Routes
All user data routes require authentication:
```bash
# These routes return 401 Unauthorized if not logged in
GET /api/user/portfolio
POST /api/user/portfolio
PUT /api/user/portfolio
DELETE /api/user/portfolio
GET /api/user/watchlist
POST /api/user/watchlist
DELETE /api/user/watchlist
GET /api/user/profile
PUT /api/user/profile
```

### Admin-Only Routes
These routes require both authentication AND admin status:
```bash
# These routes return 403 Forbidden if not an admin
GET /api/admin/check
GET /api/admin/users
GET /api/admin/users/[userId]
PUT /api/admin/users/[userId]
DELETE /api/admin/users/[userId]
GET /api/admin/stats
GET /api/admin/export-database
```

### Prisma Studio - Database Browser

**Opening Prisma Studio:**
```bash
npx prisma studio
```

**What You Can Do:**
- **Browse Tables**: View all tables (User, Portfolio, Favorite, Instrument, etc.)
- **Edit Records**: Click any cell to edit data directly
- **Add Records**: Add new rows to any table
- **Filter & Search**: Quickly find specific records
- **Relationships**: View how tables are connected
- **Database Schema**: Visual representation of your database structure

**Common Admin Tasks in Prisma Studio:**

1. **View All Users:**
   - Go to the User table
   - See all registered users with their details

2. **Reset User Password:**
   - Find the user in the User table
   - In the password field, you'll see the hashed password
   - To reset, generate a new hash (using a temporary script or API)

3. **View User's Portfolio:**
   - Go to the Portfolio table
   - Filter by userId to see all positions

4. **Delete User Data:**
   - Navigate to the table with the data
   - Select the record(s) and delete
   - Cascading deletes will automatically handle related data

5. **Run Raw SQL Queries:**
   - Click "New Query" in Prisma Studio
   - Write SQL directly to manipulate data

### Admin Database Commands

```bash
# Open database browser
npx prisma studio

# View database
npx prisma studio --browser-only

# Reset database (CAUTION: Deletes all data)
npx prisma db push --force-reset

# Generate Prisma Client
npx prisma generate

# Push schema changes
npx prisma db push
```

### Managing Users via Database

#### SQL Commands (Prisma Studio or Direct)

```sql
-- Make a user an admin
UPDATE User SET isAdmin = true, role = 'admin' WHERE email = 'user@example.com';

-- View all admin users
SELECT * FROM User WHERE isAdmin = true;

-- Count total users
SELECT COUNT(*) as totalUsers FROM User;

-- View recent signups
SELECT * FROM User ORDER BY createdAt DESC LIMIT 10;

-- View user with most portfolio items
SELECT u.name, u.email, COUNT(p.id) as portfolioCount
FROM User u
LEFT JOIN Portfolio p ON u.id = p.userId
GROUP BY u.id
ORDER BY portfolioCount DESC;

-- View user activity logs
SELECT * FROM ActivityLog ORDER BY createdAt DESC LIMIT 50;

-- Export all user data
SELECT * FROM User;
SELECT * FROM Portfolio;
SELECT * FROM Favorite;
SELECT * FROM UserPreference;
```

### User Data Export & Import

#### Export User Data (Admin)

```bash
# Via Admin API
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  http://localhost:3000/api/admin/export-database
```

#### Export Individual User Data

```bash
# Via User API
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  http://localhost:3000/api/user/export
```

## 🔌 API Endpoints

### Authentication
```bash
POST /api/auth/signup           # Create new account with profile
POST /api/auth/[...nextauth]    # NextAuth handler
```

### User Profile
```bash
GET /api/user/profile           # Get user profile
PUT /api/user/profile           # Update profile
POST /api/user/change-password   # Change password
GET /api/user/export           # Export user data
DELETE /api/user/account        # Delete account
```

### User Data
```bash
GET /api/user/watchlist         # Get user's watchlist
POST /api/user/watchlist        # Add to watchlist
DELETE /api/user/watchlist      # Remove from watchlist

GET /api/user/portfolio         # Get user's portfolio
POST /api/user/portfolio        # Add portfolio position
PUT /api/user/portfolio         # Update position
DELETE /api/user/portfolio      # Delete position

GET /api/user/preferences       # Get user preferences
PUT /api/user/preferences       # Update preferences
```

### Admin
```bash
GET /api/admin/check            # Check if user is admin
GET /api/admin/stats            # Get database statistics
GET /api/admin/users            # List all users
DELETE /api/admin/users            # Delete user
POST /api/admin/users/set-admin  # Set admin status
GET /api/admin/export-database  # Export full database
```

### Market Data
```bash
# Unified Search (All Instrument Types) - Now with Market Cap Sorting
GET /api/search?q=AAPL&type=all&limit=20      # Search all instruments (sorted by market cap)
GET /api/search?q=BTC&type=crypto             # Search only crypto (sorted by market cap rank)
GET /api/search?q=AAPL&type=stock             # Search only US stocks (sorted by market cap)
GET /api/search?q=BBRI&type=indo              # Search Indonesian stocks (sorted by market cap)
```bash
# Unified Search (All Instrument Types)
GET /api/search?q=AAPL&type=all&limit=20      # Search all instruments
GET /api/search?q=BTC&type=crypto             # Search only crypto
GET /api/search?q=AAPL&type=stock             # Search only US stocks
GET /api/search?q=BBRI&type=indo              # Search Indonesian stocks

# US Stocks (Finnhub - 90,000+ securities)
GET /api/search/stocks?q=AAPL&limit=50        # Search US stocks
GET /api/search/stocks?type=etf               # Search ETFs only
GET /api/search/stocks?type=index             # Search indices only
GET /api/stocks/price?symbol=AAPL             # Get stock quote
GET /api/stocks/history?symbol=AAPL&days=90   # Stock history with indicators

# Indonesian Stocks (700+ IDX companies)
GET /api/search/indo?q=BBRI&limit=50          # Search Indonesian stocks
POST /api/search/indo                          # Get all IDX stocks (admin)

# Cryptocurrencies (CoinGecko - 15,000+ coins)
GET /api/crypto/search?q=BTC&limit=20         # Search cryptocurrencies
GET /api/crypto/price?symbol=BTC-USD          # Get crypto price
GET /api/crypto/history?symbol=BTC-USD&days=90  # Crypto history with indicators
GET /api/crypto/popular                        # Get popular cryptocurrencies

# Precious Metals (Metals Live API - Real-time Spot Prices)
GET /api/gold/price                    # Current gold spot price (~$5,000-$5,200)
GET /api/silver/price                  # Current silver spot price
GET /api/platinum/price                # Current platinum spot price
GET /api/palladium/price               # Current palladium spot price

# Metals Historical Data (Yahoo Finance Futures)
GET /api/gold/history?days=90          # Gold historical data with technical analysis
GET /api/silver/history?days=90        # Silver historical data
GET /api/platinum/history?days=90      # Platinum historical data
GET /api/palladium/history?days=90     # Palladium historical data
```

### Portfolio Performance Analytics (New in v3.1)
```bash
GET /api/portfolio/performance         # Get performance metrics (CAGR, Sharpe, Max Drawdown)
GET /api/portfolio/snapshot            # Create portfolio value snapshot
GET /api/portfolio/snapshot            # Get historical snapshots
```

### Price Alerts (New in v3.1)
```bash
GET /api/alerts                        # Get user's alerts
GET /api/alerts?active=true            # Get only active alerts
POST /api/alerts                       # Create new alert
{
  "symbol": "BTC-USD",
  "name": "Bitcoin",
  "alertType": "ABOVE",                # ABOVE, BELOW, CHANGE_PERCENT, DAILY_HIGH, DAILY_LOW
  "targetPrice": 100000
}
DELETE /api/alerts?id=alert-id         # Delete alert
GET /api/alerts/check                  # Check and trigger alerts
POST /api/alerts/check                 # Check alerts for specific symbol/price
{
  "symbol": "BTC-USD",
  "price": 95000
}
```

### Binance Integration (New in v3.1)
```bash
POST /api/binance/connect              # Connect Binance account (read-only)
{
  "apiKey": "your-api-key",
  "apiSecret": "your-secret-key",
  "testnet": false                     # Use true for testnet
}
POST /api/binance/sync                 # Sync assets from Binance
GET /api/binance/assets                # Get synced assets
POST /api/binance/disconnect           # Disconnect and remove data
```

### Instrument Coverage Summary
| Category | Coverage | Data Source |
|----------|----------|-------------|
| US Stocks | 90,000+ | Finnhub.io |
| US ETFs | 3,000+ | Finnhub.io |
| US Indices | 100+ | Finnhub.io |
| Indonesian Stocks | 700+ | Yahoo Finance + IDX.co.id |
| Cryptocurrencies | 15,000+ | CoinGecko API |
| Precious Metals | 4 | Metals Live API |
| Currencies | 30+ | open.er-api.com |

## 🗄️ Database Schema (New in v3.1)

### New Models Added

#### PortfolioSnapshot
Tracks portfolio value over time for performance analytics.
```prisma
model PortfolioSnapshot {
  id             String   @id @default(cuid())
  userId         String
  totalValue     Float
  totalCost      Float
  totalPnL       Float
  totalPnLPercent Float
  assetCount     Int
  timestamp      DateTime @default(now())
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, timestamp])
}
```

#### PriceAlert
Price alerts for instruments with various trigger conditions.
```prisma
model PriceAlert {
  id            String       @id @default(cuid())
  userId        String
  symbol        String
  name          String
  alertType     AlertType    # ABOVE, BELOW, CHANGE_PERCENT, DAILY_HIGH, DAILY_LOW
  targetPrice   Float?
  targetPercent Float?
  condition     String
  isActive      Boolean      @default(true)
  triggered     Boolean      @default(false)
  triggeredAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, symbol])
  @@index([userId, isActive])
}
```

#### BinanceConnection
Encrypted Binance API credentials for read-only access.
```prisma
model BinanceConnection {
  id         String   @id @default(cuid())
  userId     String   @unique
  apiKey     String   # Encrypted with AES-256-CBC
  apiSecret  String   # Encrypted with AES-256-CBC
  testnet    Boolean  @default(false)
  lastSyncAt DateTime?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

#### BinanceAsset
Synced crypto assets from Binance.
```prisma
model BinanceAsset {
  id          String   @id @default(cuid())
  userId      String
  asset       String   # BTC, ETH, USDT, etc.
  free        Float    # Available balance
  locked      Float    # Locked in orders
  valueUSD    Float    # Estimated USD value
  lastUpdated DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, asset])
  @@index([userId])
}
```

## 📁 Project Structure

```
investment-advisor/
├── app/
│   ├── api/                    # API routes
│   │   ├── admin/             # Admin endpoints
│   │   ├── auth/              # Authentication endpoints
│   │   └── user/              # User data endpoints
│   ├── auth/                  # Auth pages
│   │   ├── signin/            # Sign in page
│   │   ├── signup/            # Multi-step sign up
│   │   └── error/             # Auth error page
│   ├── admin/                 # Admin dashboard
│   ├── dashboard/             # User dashboard
│   ├── settings/              # Settings with tabs
│   └── ...
├── components/
│   ├── auth/                  # Auth components
│   │   └── UserMenu.tsx       # User dropdown
│   ├── alerts/                # Price alert components (New in v3.1)
│   │   ├── AlertDialog.tsx    # Create price alerts
│   │   └── AlertsList.tsx     # Display user's alerts
│   ├── binance/               # Binance integration components (New in v3.1)
│   │   ├── ConnectDialog.tsx  # Connect Binance account
│   │   └── BinanceAssets.tsx  # Display synced assets
│   ├── portfolio/             # Portfolio components (Enhanced in v3.1)
│   │   ├── PerformanceChart.tsx   # Performance history chart
│   │   └── MetricsCard.tsx        # Performance metrics display
│   ├── ui/                    # UI components
│   └── ...
├── lib/
│   ├── api/                   # API clients (Enhanced in v3.1)
│   │   └── binance.ts         # Binance API wrapper with encryption
│   └── ...
├── prisma/
│   └── schema.prisma          # Database schema with User, Portfolio, etc.
└── ...
```

## 🌐 Deployment

### Quick Deploy to Vercel with Neon

The easiest way to deploy is using Vercel + Neon PostgreSQL:

1. **Create Neon Database** (Free tier available):
   - Go to https://console.neon.tech/signup
   - Sign up with GitHub/Google
   - Create a project (choose region closest to your users)
   - Copy the DATABASE_URL

2. **Deploy to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`: Your Neon connection string
     - `NEXTAUTH_URL`: `https://your-app.vercel.app`
     - `NEXTAUTH_SECRET`: Generate at https://generate-secret.vercel.app/32
   - Click Deploy

3. **Initialize Database** (one-time setup):
   ```bash
   # After adding DATABASE_URL to Vercel, run locally:
   DATABASE_URL="your_neon_url" npx prisma db push
   ```

### Vercel (Recommended)

1. **Push to GitHub**
2. **Deploy to Vercel** with environment variables:
   - `DATABASE_URL` - PostgreSQL connection string from Neon
   - `NEXTAUTH_URL` - Your domain URL
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

### Environment Variables

```env
# Database
DATABASE_URL=file:./dev.db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=investment-advisor-secret-key-change-in-production

# API Keys (Optional - Free tiers work without keys)
FINNHUB_API_KEY=your_finnhub_api_key_here        # For expanded US stock coverage
COINGECKO_API_KEY=your_coingecko_api_key_here    # Optional - free tier works
TWELVE_DATA_API_KEY=your_twelve_data_key_here    # For additional stock data
MARKETSTACK_API_KEY=your_marketstack_key_here    # For additional stock data
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key    # For additional market data
```

### Getting API Keys

**Finnhub.io (Recommended for US Stocks):**
- Sign up at https://finnhub.io/
- Free tier: 60 calls/minute
- Provides 90,000+ US stocks, ETFs, indices

**CoinGecko (For Crypto):**
- Sign up at https://www.coingecko.com/en/api
- Free tier: 50 calls/minute (no key required)
- Pro tier available for higher limits

**Other APIs (Optional):**
- Twelve Data: https://twelvedata.com/
- MarketStack: https://marketstack.com/
- Alpha Vantage: https://www.alphavantage.co/

## ⚠️ Disclaimer

This application is for educational and informational purposes only. The data and analysis provided should not be considered as financial advice. Always conduct your own research and consult with a qualified financial advisor before making investment decisions.

## 📝 License

This project is open source and available under the MIT License.

---

**Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and NextAuth.js**
