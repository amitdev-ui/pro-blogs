# Scraper Issues - No Posts Found

## Problem Summary

The scraper is finding **0 posts** from websites because the **selectors are outdated** and don't match the current HTML structure of the websites.

## Root Cause

When you scrape a website, the scraper uses CSS selectors to find:
- Article containers (where blog posts are listed)
- Post titles
- Post links
- Author names
- Images
- Dates

If these selectors don't match the current HTML structure, **no posts will be found**.

## Evidence

When testing Web.dev, the scraper found:
- ✅ 1 container element
- ❌ No title found
- ❌ No link found  
- ❌ No author found

This means the selectors need to be updated to match the current HTML structure.

## Solution

### Option 1: Update Selectors via Admin Panel

1. Go to `/admin/websites`
2. Click on a website to edit it
3. Inspect the website's HTML structure (right-click → Inspect)
4. Update the selectors to match the current HTML
5. Save and test

### Option 2: Use Test Script

Run the test script to see what selectors are working:

```bash
npx tsx scripts/test-website-selectors.ts "Website Name"
```

This will show you:
- Which selectors are working
- Which selectors are failing
- What the HTML structure looks like

### Option 3: Check Website HTML Manually

1. Visit the website URL in your browser
2. Open DevTools (F12)
3. Inspect a blog post card/article
4. Note the CSS classes and HTML structure
5. Update selectors in the admin panel accordingly

## Common Issues

### JavaScript-Rendered Content

Some websites (like Web.dev, CSS-Tricks) use JavaScript to render content. The current scraper uses Cheerio which only parses static HTML.

**Solutions:**
- Use Puppeteer (already in package.json) for JavaScript rendering
- Wait for server-side rendering if available
- Use the website's RSS feed if available

### SSL/TLS Errors

Some websites may block automated requests or have SSL issues.

**Solutions:**
- Update User-Agent headers
- Add delays between requests
- Use proxies if needed

## Next Steps

1. **Test each website** to see which ones need selector updates
2. **Update selectors** in the database for non-working websites
3. **Consider using Puppeteer** for JavaScript-rendered sites
4. **Monitor logs** to see which websites are failing

## Testing Commands

```bash
# Test all websites
npx tsx scripts/test-all-websites.ts

# Test specific website
npx tsx scripts/test-website-selectors.ts "Web.dev"

# Check which websites are ready
npx tsx scripts/check-ready-websites.ts
```

## Updating Selectors

The selectors are stored in the database as JSON. Each website needs:

```json
{
  "articleContainer": "css-selector-for-article-container",
  "title": "css-selector-for-title",
  "link": "css-selector-for-link",
  "author": "css-selector-for-author",
  "authorImage": "css-selector-for-author-image",
  "date": "css-selector-for-date",
  "image": "css-selector-for-image",
  "description": "css-selector-for-description",
  "category": "css-selector-for-category",
  "tags": "css-selector-for-tags"
}
```

Example for a website using `<article>` tags:

```json
{
  "articleContainer": "article",
  "title": "article h2 a",
  "link": "article h2 a",
  "author": ".author-name",
  "date": "time",
  "image": "article img"
}
```

