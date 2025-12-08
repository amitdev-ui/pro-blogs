# Fixing Scraper Issues - No Posts Found

## Summary

Your scraper is finding **0 posts** because the **website selectors are outdated** and don't match the current HTML structure of the websites.

## What I've Fixed

1. ✅ **Better Error Messages**: The scraper now shows a clear error when 0 posts are found
2. ✅ **Testing Scripts**: Created scripts to test and diagnose selector issues
3. ✅ **Documentation**: Created guides to help fix the issue

## Next Steps to Fix

### Step 1: Test Which Websites Need Updates

Run this command to see which websites are finding posts:

```bash
npx tsx scripts/test-all-websites.ts
```

This will show you which websites are working and which need selector updates.

### Step 2: Test Individual Websites

Test a specific website to see what's wrong:

```bash
npx tsx scripts/test-website-selectors.ts "Web.dev"
```

Or test CSS-Tricks:

```bash
npx tsx scripts/test-website-selectors.ts "CSS-Tricks"
```

### Step 3: Update Selectors

For each website that's not working:

1. **Go to Admin Panel**: `/admin/websites`
2. **Click on the website** to edit it
3. **Visit the website URL** in your browser
4. **Open DevTools** (F12) and inspect a blog post
5. **Update the selectors** to match the current HTML structure
6. **Save and test again**

### Step 4: Example Selector Updates

The selectors need to match the current HTML. Here's what to look for:

```json
{
  "articleContainer": "CSS selector for the container that holds each blog post",
  "title": "CSS selector for the post title",
  "link": "CSS selector for the link to the full post",
  "author": "CSS selector for the author name",
  "date": "CSS selector for the publish date",
  "image": "CSS selector for the featured image"
}
```

**Common patterns:**
- Article containers: `article`, `.post-card`, `.blog-post`, `[class*='post']`
- Titles: `h1`, `h2`, `h3`, `.title`, `.post-title`
- Links: Usually inside the title: `h2 a`, `h3 a`, `.post-title a`
- Authors: `.author`, `.author-name`, `.byline`
- Dates: `time`, `[datetime]`, `.post-date`
- Images: `img`, `.featured-image img`

## Why This Happened

Websites change their HTML structure over time. When they do:
- Old selectors stop working
- The scraper finds 0 posts
- You need to update the selectors

## Testing Commands Reference

```bash
# Check which websites are ready
npx tsx scripts/check-ready-websites.ts

# Test all websites
npx tsx scripts/test-all-websites.ts

# Test specific website
npx tsx scripts/test-website-selectors.ts "Website Name"

# Test scraper with first website
npx tsx scripts/test-scraper.ts
```

## Important Notes

1. **JavaScript-Rendered Sites**: Some sites (like Web.dev, CSS-Tricks) use JavaScript to render content. The current scraper only sees static HTML. You may need to:
   - Wait for the page to load
   - Use Puppeteer for JavaScript rendering
   - Use RSS feeds if available

2. **SSL Errors**: Some websites may block automated requests. You may need to:
   - Update User-Agent headers
   - Add delays between requests
   - Check network/firewall settings

3. **Progress Endpoint**: The repeated GET requests you're seeing are normal - it's the progress polling system checking for updates.

## Quick Fix for Web.dev

Since Web.dev was specifically mentioned, here's how to fix it:

1. Visit https://web.dev/blog/ in your browser
2. Open DevTools (F12)
3. Inspect a blog post card
4. Note the HTML structure and CSS classes
5. Update the selectors in `/admin/websites` to match

The current selectors for Web.dev are generic and may not match their actual HTML structure.

## Need Help?

- Check the logs in `/admin/logs` to see error messages
- Test websites one at a time using the test scripts
- Update selectors based on the actual HTML structure
- Consider using browser DevTools to inspect the HTML

