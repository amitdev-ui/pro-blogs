# Step-by-Step Deployment Guide

## Step 1: Create GitHub Repository

### Option A: Private (Recommended - Safer)
- ✅ Your code remains private
- ✅ Only you can see it
- ✅ Good for production apps
- ✅ Free for private repos

### Option B: Public
- ✅ Anyone can see your code
- ✅ Good for open source projects
- ❌ Not recommended for private projects

**Recommendation**: Use **PRIVATE** repo (safer)

## Step 2: Create Repo on GitHub

1. Go to: https://github.com/new
2. Repository name: `blogs-scraper` (or any name)
3. Description: "Blog Scraper Application"
4. Select: **Private** ✅
5. **DON'T** initialize with README (we already have files)
6. Click "Create repository"

## Step 3: Push Your Code to GitHub

### Commands to Run (in your project folder):

```bash
# 1. Initialize git (if not already done)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit"

# 4. Add GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` and `REPO_NAME` with your actual GitHub username and repo name.

## Step 4: Connect to Railway

1. Go to Railway dashboard
2. Click "New Project"
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Railway will detect it's a Next.js app automatically!

## Important: Environment Variables

Before deploying, Railway will ask for environment variables:

### Required:
- `DATABASE_URL` - You'll get this after creating MySQL database in Railway

### Steps:
1. In Railway project, click "New" → "Database" → "MySQL"
2. Railway creates database and gives you `DATABASE_URL`
3. Go back to your web service
4. Go to "Variables" tab
5. Add: `DATABASE_URL` = (paste the URL Railway gave you)

## Step 5: Deploy!

Railway will automatically:
- Install dependencies
- Build your app
- Deploy it
- Give you a URL (like: `your-app.up.railway.app`)

## After Deployment:

1. Wait for build to complete (2-5 minutes)
2. Check logs - should see: `[Auto-Scheduler] ✓ Automatic scraping started`
3. Visit your URL
4. Admin panel: `your-url.com/admin`

---

## Quick Checklist:

- [ ] GitHub repo created (Private)
- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Connected GitHub repo
- [ ] MySQL database added in Railway
- [ ] DATABASE_URL environment variable set
- [ ] Deployment successful
- [ ] Auto-scheduler running (check logs)

