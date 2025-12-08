# Database Access Guide

## Your Database Details:
- **Database Name**: `blogs_scraper`
- **Username**: `root`
- **Password**: (empty)
- **Host**: `localhost`
- **Port**: `3306`

## Method 1: phpMyAdmin (Easiest)

1. Open XAMPP Control Panel
2. Start MySQL service
3. Click "Admin" button next to MySQL, OR
4. Open browser and go to: `http://localhost/phpmyadmin`
5. Login with:
   - Username: `root`
   - Password: (leave empty)
6. Click on `blogs_scraper` database in left sidebar
7. View/Edit tables: Website, Post, Log, Ad

## Method 2: MySQL Command Line

```bash
# Navigate to XAMPP MySQL bin folder
cd C:\xampp\mysql\bin

# Connect to MySQL
mysql.exe -u root -p

# When prompted for password, just press Enter (no password)

# Use the database
USE blogs_scraper;

# View tables
SHOW TABLES;

# View posts count
SELECT COUNT(*) FROM Post;

# View websites
SELECT * FROM Website;
```

## Method 3: Using Database Tools

### MySQL Workbench
- Download: https://dev.mysql.com/downloads/workbench/
- Connection Details:
  - Host: `localhost`
  - Port: `3306`
  - Username: `root`
  - Password: (empty)
  - Database: `blogs_scraper`

### DBeaver (Free)
- Download: https://dbeaver.io/download/
- Same connection details as above

### VS Code Extension
- Install: "MySQL" extension
- Connect using same credentials

## Quick Database Commands

```sql
-- View all posts
SELECT id, title, slug, createdAt FROM Post ORDER BY createdAt DESC LIMIT 10;

-- Count posts
SELECT COUNT(*) as total_posts FROM Post;

-- View websites
SELECT * FROM Website;

-- View recent logs
SELECT * FROM Log ORDER BY createdAt DESC LIMIT 10;

-- Search posts
SELECT * FROM Post WHERE title LIKE '%keyword%';
```

