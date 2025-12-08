# Quick Hosting Guide

## Your Website Requirements:
- **Next.js App** (Node.js)
- **MySQL Database**
- **Server must run 24/7** (for auto-scraper)

## Best Hosting Options:

### 1. **Vercel** (Recommended - Free)
- ✅ Free for Next.js
- ✅ Easy setup
- ⚠️ But MySQL needs separate hosting (PlanetScale, Railway, etc.)

### 2. **Railway** (Easiest - Paid)
- ✅ Hosts Next.js + MySQL together
- ✅ One-click deploy
- 💰 ~$5/month

### 3. **DigitalOcean App Platform**
- ✅ Good for Next.js
- ✅ Can add MySQL database
- 💰 ~$12/month

## Quick Steps (Railway - Easiest):

1. **Go to**: https://railway.app
2. **Sign up** (GitHub login)
3. **Create New Project**
4. **Connect your GitHub repo**
5. **Add MySQL Database**:
   - Click "New" → "Database" → "MySQL"
6. **Set Environment Variables**:
   - `DATABASE_URL` = (Railway gives you this)
7. **Deploy** - Railway auto-builds and deploys!

## Important Before Hosting:

### 1. Create `.env` file:
```
DATABASE_URL="mysql://user:password@host:port/database"
NODE_ENV="production"
```

### 2. Build locally to test:
```bash
npm run build
```

### 3. Make sure MySQL is accessible from internet (not localhost)

## For FREE Hosting:

### Option A: Vercel + PlanetScale (Free MySQL)
1. Host Next.js on Vercel (free)
2. Use PlanetScale for MySQL (free tier)
3. Update DATABASE_URL in Vercel settings

### Option B: Render (Free tier available)
1. Go to https://render.com
2. Create Web Service (Next.js)
3. Create MySQL database
4. Add DATABASE_URL environment variable
5. Deploy!

## Checklist:
- [ ] Database is accessible (not localhost)
- [ ] Environment variables set correctly
- [ ] Build succeeds (`npm run build`)
- [ ] Auto-scheduler will run (needs 24/7 server)

## After Hosting:
1. Check logs for: `[Auto-Scheduler] ✓ Automatic scraping started`
2. Visit your website URL
3. Admin panel: `your-url.com/admin`

