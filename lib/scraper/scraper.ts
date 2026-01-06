import * as cheerio from "cheerio";
import { ScraperConfig, ScrapedPost } from "./types";
import {
  fetchHTML,
  extractText,
  extractAttribute,
  extractMultiple,
  generateSlug,
  parseDate,
  estimateReadingTime,
} from "./utils";
import { cleanArticleContent } from "./content-cleaner";

export class BlogScraper {
  private config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  async scrapePage(url: string, startOffset: number = 0): Promise<ScrapedPost[]> {
    const allPosts: ScrapedPost[] = []; // Declare outside try-catch for error recovery
    try {
      const maxPages = this.config.pagination?.maxPages || 10;
      let currentUrl = url;
      let pageCount = 0;
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3; // Stop after 3 consecutive errors
      
      // If we have an offset, we need to skip to that page first
      // For page-number pagination, we can directly jump to the page
      // For next-page pagination, we need to follow links until we reach the offset
      let skippedPages = 0;
      
      // Skip to the starting offset for page-number pagination
      if (startOffset > 0 && this.config.pagination?.type === "page-number") {
        try {
          const urlObj = new URL(currentUrl);
          const currentPath = urlObj.pathname;
          
          // Check if URL already has /page/X/ pattern
          const pageMatch = currentPath.match(/\/page\/(\d+)\/?$/);
          if (pageMatch) {
            // Replace with offset page
            const startPage = parseInt(pageMatch[1]) + startOffset;
            currentUrl = currentPath.replace(/\/page\/\d+\/?$/, `/page/${startPage}/`);
            currentUrl = `${urlObj.origin}${currentUrl}${urlObj.search}`;
          } else {
            // Add page number to start from offset
            const basePath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
            const startPage = startOffset + 1; // Start from page 1 if offset is 0
            currentUrl = `${urlObj.origin}${basePath}page/${startPage}/${urlObj.search}`;
          }
          skippedPages = startOffset;
          console.log(`[Pagination] Starting from offset: page ${startOffset + 1} (skipped ${startOffset} pages)`);
        } catch (error) {
          console.log(`[Pagination] Could not construct offset URL, starting from beginning: ${error}`);
        }
      } else if (startOffset > 0 && this.config.pagination?.type === "next-page") {
        // For next-page pagination, we need to follow links to skip pages
        // This is less efficient but necessary for sites without page numbers
        console.log(`[Pagination] Next-page pagination: Need to skip ${startOffset} pages (this may take time)`);
        // We'll skip pages in the loop below
      }

      // Scrape multiple pages if pagination is configured
      // For next-page pagination with offset, skip pages until we reach the offset
      while ((this.config.pagination?.type === "next-page" && startOffset > 0 && skippedPages < startOffset) || pageCount < maxPages) {
        // Skip pages for next-page pagination to reach offset
        if (this.config.pagination?.type === "next-page" && startOffset > 0 && skippedPages < startOffset) {
          try {
            const html = await fetchHTML(currentUrl);
            const $ = cheerio.load(html);
            
            // Find next page link
            let nextPageUrl: string | undefined;
            if (this.config.pagination.selector) {
              const nextLink = $(this.config.pagination.selector).first().attr("href");
              if (nextLink) {
                try {
                  nextPageUrl = new URL(nextLink, currentUrl).href;
                } catch {
                  if (nextLink.startsWith("/")) {
                    try {
                      const baseUrl = new URL(currentUrl);
                      nextPageUrl = `${baseUrl.origin}${nextLink}`;
                    } catch {}
                  }
                }
              }
            }
            
            if (nextPageUrl && nextPageUrl !== currentUrl) {
              currentUrl = nextPageUrl;
              skippedPages++;
              if (skippedPages % 50 === 0) {
                console.log(`[Pagination] Skipping pages to reach offset: ${skippedPages}/${startOffset} pages skipped`);
              }
              await new Promise(resolve => setTimeout(resolve, 500)); // Small delay while skipping
              continue;
            } else {
              // No more pages to skip, start scraping from here
              console.log(`[Pagination] Reached end while skipping. Starting scrape from page ${skippedPages + 1}`);
              break;
            }
          } catch (error) {
            console.log(`[Pagination] Error while skipping pages: ${error}. Starting scrape from current position.`);
            break;
          }
        }
        
        // Normal scraping logic starts here
        let html: string;
        try {
          html = await fetchHTML(currentUrl);
          consecutiveErrors = 0; // Reset error counter on success
        } catch (error: any) {
          consecutiveErrors++;
          const errorMsg = String(error);
          const isSSL = errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('bad record mac');
          const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT');
          const is404 = errorMsg.includes('404') || errorMsg.includes('status code 404');
          
          // If we have posts already, log error and continue with what we have
          if (allPosts.length > 0) {
            console.log(`[Pagination] Error on page ${pageCount + 1}: ${errorMsg.substring(0, 100)}. Continuing with ${allPosts.length} posts found so far.`);
            
            // For SSL/network errors, try to continue (might be temporary)
            if ((isSSL || isTimeout) && consecutiveErrors < maxConsecutiveErrors) {
              console.log(`[Pagination] SSL/Network error detected. Retrying... (${consecutiveErrors}/${maxConsecutiveErrors})`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
              continue;
            }
            
            // For 404 or too many errors, stop pagination but return posts found
            if (is404 || consecutiveErrors >= maxConsecutiveErrors) {
              console.log(`[Pagination] Stopping pagination. Returning ${allPosts.length} posts found.`);
              break;
            }
            
            // For other errors, skip this page and continue
            pageCount++;
            if (consecutiveErrors < maxConsecutiveErrors) {
              continue;
            } else {
              break;
            }
          } else {
            // No posts found yet, throw error
            throw error;
          }
        }
        const $ = cheerio.load(html);
        const pagePosts: ScrapedPost[] = [];

        // Find all article containers - try multiple selectors if first fails
        let containers = $(this.config.selectors.articleContainer);
        
        // Fallback if primary selector doesn't work
        if (containers.length === 0) {
          const fallbackSelectors = ["article", ".post", ".card", "[class*='post']", "[class*='card']"];
          for (const selector of fallbackSelectors) {
            containers = $(selector);
            if (containers.length > 0) break;
          }
        }

        containers.each((_, element) => {
          const $article = $(element);
          const post = this.extractPost($, $article, currentUrl);
          if (post) {
            pagePosts.push(post);
          }
        });

        // Add posts from this page
        allPosts.push(...pagePosts);

        // If no posts found or pagination not configured, stop
        if (pagePosts.length === 0 || !this.config.pagination) {
          break;
        }

        // Find next page link
        let nextPageUrl: string | undefined;
        
        if (this.config.pagination.type === "next-page" && this.config.pagination.selector) {
          const nextLink = $(this.config.pagination.selector).first().attr("href");
          if (nextLink) {
            try {
              nextPageUrl = new URL(nextLink, currentUrl).href;
            } catch {
              // Invalid URL, try relative
              if (nextLink.startsWith("/")) {
                try {
                  const baseUrl = new URL(currentUrl);
                  nextPageUrl = `${baseUrl.origin}${nextLink}`;
                } catch {
                  // Can't construct URL
                }
              }
            }
          }
          
          // Fallback: Try common next page selectors if configured selector didn't work
          if (!nextPageUrl) {
            const fallbackSelectors = [
              "a[rel='next']",
              ".pagination a.next",
              ".pagination .next",
              "a.next",
              ".next-page",
              "a.next-page",
              ".load-more",
              "a.load-more",
              "[aria-label*='next' i]",
              "[aria-label*='Next' i]",
            ];
            
            for (const selector of fallbackSelectors) {
              const fallbackLink = $(selector).first().attr("href");
              if (fallbackLink) {
                try {
                  nextPageUrl = new URL(fallbackLink, currentUrl).href;
                  if (nextPageUrl && nextPageUrl !== currentUrl) {
                    break;
                  }
                } catch {
                  // Try relative
                  if (fallbackLink.startsWith("/")) {
                    try {
                      const baseUrl = new URL(currentUrl);
                      nextPageUrl = `${baseUrl.origin}${fallbackLink}`;
                      if (nextPageUrl && nextPageUrl !== currentUrl) {
                        break;
                      }
                    } catch {
                      // Continue to next selector
                    }
                  }
                }
              }
            }
          }
        } else if (this.config.pagination.type === "page-number") {
          // For page-number pagination, increment page number
          pageCount++;
          if (pageCount < maxPages) {
            try {
              const urlObj = new URL(currentUrl);
              const currentPath = urlObj.pathname;
              
              // Check if URL already has /page/X/ pattern (TechCrunch style)
              const pageMatch = currentPath.match(/\/page\/(\d+)\/?$/);
              if (pageMatch) {
                // Replace existing page number
                const nextPage = parseInt(pageMatch[1]) + 1;
                nextPageUrl = currentPath.replace(/\/page\/\d+\/?$/, `/page/${nextPage}/`);
                nextPageUrl = `${urlObj.origin}${nextPageUrl}${urlObj.search}`;
              } else {
                // Add /page/2/ to path (TechCrunch style)
                const basePath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
                nextPageUrl = `${urlObj.origin}${basePath}page/${pageCount + 1}/${urlObj.search}`;
              }
            } catch {
              // Fallback: try query parameter
              const pageParam = currentUrl.includes("?") ? `&page=${pageCount + 1}` : `?page=${pageCount + 1}`;
              nextPageUrl = `${currentUrl}${pageParam}`;
            }
          }
        }

        // If still no next page found, try URL-based pagination (TechCrunch style)
        if (!nextPageUrl || nextPageUrl === currentUrl) {
          // Try multiple pagination patterns
          try {
            const urlObj = new URL(currentUrl);
            const currentPath = urlObj.pathname;
            
            // Pattern 1: URL path like /startups/page/2/ (TechCrunch style)
            const pathMatch = currentPath.match(/\/page\/(\d+)\/?$/);
            if (pathMatch) {
              const currentPage = parseInt(pathMatch[1]);
              const nextPage = currentPage + 1;
              nextPageUrl = currentPath.replace(/\/page\/\d+\/?$/, `/page/${nextPage}/`);
              nextPageUrl = `${urlObj.origin}${nextPageUrl}${urlObj.search}`;
            } else {
              // Pattern 2: Add /page/2/ to URL path (TechCrunch style)
              const basePath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
              nextPageUrl = `${urlObj.origin}${basePath}page/2/${urlObj.search}`;
            }
          } catch {
            // URL parsing failed, try simple patterns
            if (currentUrl.match(/\/page\/\d+\/?$/)) {
              // Replace page number in path
              nextPageUrl = currentUrl.replace(/\/page\/(\d+)\/?$/, (match, num) => {
                return `/page/${parseInt(num) + 1}/`;
              });
            } else {
              // Try adding /page/2/ to path
              const cleanUrl = currentUrl.endsWith('/') ? currentUrl : currentUrl + '/';
              nextPageUrl = `${cleanUrl}page/2/`;
            }
          }
        }

        // Final check: if still no valid next page, stop
        if (!nextPageUrl || nextPageUrl === currentUrl) {
          console.log(`No next page found for ${currentUrl}. Stopping pagination at page ${pageCount + 1}.`);
          break;
        }
        
        // Log pagination progress for debugging
        const actualPageNumber = startOffset + pageCount + 1;
        console.log(`[Pagination] Page ${actualPageNumber} (offset: ${startOffset}, local: ${pageCount + 1}/${maxPages}): Scraped ${pagePosts.length} posts from ${currentUrl}. Total so far: ${allPosts.length}. Next: ${nextPageUrl}`);

        currentUrl = nextPageUrl;
        pageCount++;

        // Small delay between pages to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const endingPage = startOffset + pageCount;
      console.log(`[Pagination] Completed: Found ${allPosts.length} posts from ${pageCount} pages (starting from offset ${startOffset}, ending at page ${endingPage})`);
      return allPosts;
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      // If we have any posts, return them instead of empty array
      // This ensures we don't lose progress on network errors
      if (allPosts && allPosts.length > 0) {
        console.log(`[Pagination] Error occurred but returning ${allPosts.length} posts found before error.`);
        return allPosts;
      }
      return [];
    }
  }

  /**
   * Scrape a single page without pagination (for category scraper)
   */
  async scrapeSinglePage(url: string): Promise<ScrapedPost[]> {
    try {
      const html = await fetchHTML(url);
      const $ = cheerio.load(html);
      const pagePosts: ScrapedPost[] = [];

      // Find all article containers - try multiple selectors if first fails
      let containers = $(this.config.selectors.articleContainer);
      
      // Fallback if primary selector doesn't work
      if (containers.length === 0) {
        const fallbackSelectors = ["article", ".post", ".card", "[class*='post']", "[class*='card']"];
        for (const selector of fallbackSelectors) {
          containers = $(selector);
          if (containers.length > 0) break;
        }
      }

      containers.each((_, element) => {
        const $article = $(element);
        const post = this.extractPost($, $article, url);
        if (post) {
          pagePosts.push(post);
        }
      });

      return pagePosts;
    } catch (error) {
      console.error(`Error scraping single page ${url}:`, error);
      return [];
    }
  }

  private extractPost(
    $: cheerio.CheerioAPI,
    $article: cheerio.Cheerio<any>,
    baseUrl: string
  ): ScrapedPost | null {
    try {
      // Extract title - try multiple approaches
      let title = extractText($, this.config.selectors.title, $article);
      
      // If no title found, try finding any heading or link text
      if (!title) {
        title = $article.find("h1, h2, h3, h4").first().text().trim();
      }
      if (!title) {
        title = $article.find("a").first().text().trim();
      }
      
      if (!title || title.length < 5) return null;

      // Extract link - try multiple approaches
      let link = extractAttribute($, this.config.selectors.link || "a", "href", $article);
      
      // If no link found, try finding any link in the article
      if (!link) {
        link = $article.find("a").first().attr("href") || "";
      }
      
      // Filter out non-blog links (YouTube, social media, etc.)
      if (link && (
        link.includes("youtu.be") ||
        link.includes("youtube.com") ||
        link.includes("twitter.com") ||
        link.includes("facebook.com") ||
        link.includes("linkedin.com") ||
        link.includes("instagram.com") ||
        link.startsWith("#") ||
        link.startsWith("mailto:")
      )) {
        // Try to find a better link - look for blog post patterns
        const allLinks = $article.find("a").map((_, el) => $(el).attr("href")).get();
        const blogLink = allLinks.find(l => 
          l && !l.includes("youtu.be") && 
          !l.includes("youtube.com") && 
          !l.includes("twitter.com") &&
          !l.includes("facebook.com") &&
          !l.includes("linkedin.com") &&
          (l.includes("/marketing/") || l.includes("/sales/") || l.includes("/service/") || l.includes("/agency/") || (l.startsWith("/") && l.length > 5))
        );
        if (blogLink) {
          link = blogLink;
        }
      }
      
      if (link && !link.startsWith("http")) {
        try {
          // Fix for CSS-Tricks: if baseUrl ends with /archives/ and link starts with /archives
          // Remove duplicate path segments
          const baseUrlObj = new URL(baseUrl);
          if (link.startsWith("/")) {
            // Absolute path from root
            link = `${baseUrlObj.origin}${link}`;
          } else {
            // Relative path
          link = new URL(link, baseUrl).href;
          }
          
          // Clean up double slashes in path (but preserve http://)
          link = link.replace(/([^:]\/)\/+/g, "$1");
          
          // Fix specific CSS-Tricks issue: remove duplicate /archives paths
          if (link.includes("css-tricks.com")) {
            link = link.replace(/\/archives\/\/archives/g, "/archives");
            link = link.replace(/\/archives\/archives/g, "/archives");
          }
        } catch {
          link = baseUrl;
        }
      }
      
      // Validate the final URL
      if (link) {
        try {
          const urlObj = new URL(link);
          // Fix any remaining double slashes in path
          urlObj.pathname = urlObj.pathname.replace(/\/+/g, "/");
          link = urlObj.href;
        } catch {
          // Invalid URL, try to construct from title slug
          const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          link = `${baseUrl}/${titleSlug}`;
        }
      }
      
      if (!link || link === baseUrl) {
        // If still no valid link, try to construct from title slug
        const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        link = `${baseUrl}/${titleSlug}`;
      }

      // Extract description
      const description =
        extractText($, this.config.selectors.description || "", $article) ||
        title.substring(0, 200);

      // Extract author
      const author = extractText($, this.config.selectors.author, $article) || "Unknown";

      // Extract author image
      const authorImage = extractAttribute(
        $,
        this.config.selectors.authorImage || "",
        "src",
        $article
      );

      // Extract date
      const dateString =
        extractAttribute($, this.config.selectors.date, "datetime", $article) ||
        extractText($, this.config.selectors.date, $article);
      const date = parseDate(dateString);

      // Extract thumbnail/card image - try multiple sources for card display
      let thumbnail = this.extractImage($, $article, baseUrl, [
        this.config.selectors.image || "img",
        ".thumbnail img",
        ".card-image img",
        ".post-thumbnail img",
        ".featured-image img",
        "[class*='thumbnail'] img",
        "[class*='card-image'] img",
        "[class*='post-image'] img",
        "img[loading='lazy']",
        "img",
      ]);

      // Extract cover/featured image - prefer larger images for full post display
      let coverImage = this.extractImage($, $article, baseUrl, [
        ".cover-image img",
        ".featured-image img",
        ".hero-image img",
        ".post-cover img",
        "[class*='cover'] img",
        "[class*='featured'] img",
        "[class*='hero'] img",
        "img[width][height]", // Images with dimensions are usually featured
        this.config.selectors.image || "img",
        "img",
      ], true); // Prefer larger images

      // If we only found one image, use it for both
      if (!thumbnail && coverImage) {
        thumbnail = coverImage;
      }
      if (!coverImage && thumbnail) {
        coverImage = thumbnail;
      }

      // Extract category
      const category = extractText($, this.config.selectors.category || "", $article);

      // Extract tags
      const tags = extractMultiple($, this.config.selectors.tags || "", $article);

      // Generate slug
      const slug = generateSlug(title);

      // Estimate reading time (will be updated when content is scraped)
      const readingTime = "5 min read";

      return {
        title,
        slug,
        description,
        author,
        authorImage: authorImage || undefined,
        date,
        readingTime,
        category: category || undefined,
        tags,
        thumbnail: thumbnail || undefined,
        coverImage: coverImage || undefined,
        sourceUrl: link,
      };
    } catch (error) {
      console.error("Error extracting post:", error);
      return null;
    }
  }

  /**
   * Extract image from article element with multiple fallback strategies
   */
  private extractImage(
    $: cheerio.CheerioAPI,
    $article: cheerio.Cheerio<any>,
    baseUrl: string,
    selectors: string[],
    preferLarge: boolean = false
  ): string | undefined {
    let bestImage: string | undefined;
    let bestSize = 0;

    for (const selector of selectors) {
      try {
        const $imgs = $article.find(selector);
        
        if ($imgs.length > 0) {
          $imgs.each((_, element) => {
            const $img = $(element);
            const src = $img.attr("src") || 
                       $img.attr("data-src") || 
                       $img.attr("data-lazy-src") ||
                       $img.attr("data-original") ||
                       $img.attr("data-url") ||
                       "";

            if (src && !src.includes("avatar") && !src.includes("icon") && !src.includes("logo")) {
              // Skip small icons, avatars, and logos
              const width = parseInt($img.attr("width") || "0");
              const height = parseInt($img.attr("height") || "0");
              const size = width * height;

              // Filter out very small images (likely icons)
              if (width > 100 && height > 100) {
                if (preferLarge) {
                  // For cover images, prefer larger images
                  if (size > bestSize) {
                    bestImage = src;
                    bestSize = size;
                  }
                } else {
                  // For thumbnails, take first decent-sized image
                  if (!bestImage) {
                    bestImage = src;
                  }
                }
              } else if (!bestImage && src.length > 0) {
                // Fallback: use any image if we haven't found one yet
                bestImage = src;
              }
            }
          });
        }
      } catch (e) {
        // Continue to next selector
      }

      // If we found a good image and not preferring large, return early
      if (bestImage && !preferLarge && bestSize > 10000) {
        break;
      }
    }

    // Make image URL absolute if relative
    if (bestImage && !bestImage.startsWith("http")) {
      try {
        bestImage = new URL(bestImage, baseUrl).href;
      } catch {
        // Invalid URL, return undefined
        return undefined;
      }
    }

    return bestImage;
  }

  /**
   * Scrape full post content and extract featured image
   * Returns object with content and featuredImage
   */
  async scrapeFullPost(url: string): Promise<{ content: string; featuredImage?: string }> {
    try {
      // Validate and fix URL before fetching
      let validUrl = url;
      try {
        const urlObj = new URL(url);
        // Fix double slashes in path
        urlObj.pathname = urlObj.pathname.replace(/\/+/g, "/");
        validUrl = urlObj.href;
        
        // Fix specific CSS-Tricks issue: remove duplicate /archives paths
        if (validUrl.includes("css-tricks.com")) {
          validUrl = validUrl.replace(/\/archives\/\/archives/g, "/archives");
          validUrl = validUrl.replace(/\/archives\/archives/g, "/archives");
          // Remove trailing /archives if it's just the archives page (not a post)
          if (validUrl.match(/\/archives\/?$/) && !validUrl.match(/\/archives\/[^\/]+\//)) {
            console.log(`[CSS-Tricks] ⚠️ Warning: Invalid post URL detected (archives page, not a post): ${validUrl}`);
            return { content: "", featuredImage: undefined };
          }
        }
      } catch (urlError) {
        console.error(`[Scraper] ❌ Invalid URL: ${url}`, urlError);
        return { content: "", featuredImage: undefined };
      }
      
      const html = await fetchHTML(validUrl);
      const $ = cheerio.load(html);

      // Detect if this is a TechCrunch URL
      const isTechCrunch = validUrl.includes("techcrunch.com");
      // Detect if this is a CSS-Tricks URL
      const isCSSTricks = validUrl.includes("css-tricks.com");
      // Detect if this is an Ahrefs URL
      const isAhrefs = validUrl.includes("ahrefs.com/blog");
      // Detect if this is a HubSpot URL
      const isHubSpot = validUrl.includes("blog.hubspot.com") || validUrl.includes("hubspot.com/blog");
      
      // Debug logging for Ahrefs
      if (isAhrefs) {
        const articleCount = $("article").length;
        const mainCount = $("main").length;
        const postBodyCount = $("[class*='post-body'], [class*='post-content']").length;
        console.log(`[Ahrefs Debug] URL: ${validUrl}`);
        console.log(`[Ahrefs Debug] Found: ${articleCount} articles, ${mainCount} main tags, ${postBodyCount} post-content/post-body elements`);
      }
      
      // Debug logging for HubSpot (initial check)
      if (isHubSpot) {
        const articleCount = $("article").length;
        const mainCount = $("main").length;
        const hsgContentCount = $("[class*='hsg-post-content'], [class*='blog-post-content'], [class*='post-content'], [id*='post-content'], [id*='article-content']").length;
        const allTextLength = $.text().trim().length;
        console.log(`[HubSpot Debug] URL: ${validUrl}`);
        console.log(`[HubSpot Debug] Found: ${articleCount} articles, ${mainCount} main tags, ${hsgContentCount} content-related elements`);
        console.log(`[HubSpot Debug] Total page text: ${allTextLength} chars`);
        
        // Log actual class names found on article/main elements
        $("article, main").each((i, el) => {
          if (i < 3) { // Only log first 3
            const classes = $(el).attr("class") || "";
            const id = $(el).attr("id") || "";
            const textLength = $(el).text().trim().length;
            console.log(`[HubSpot Debug] Element ${i+1}: class="${classes.substring(0, 100)}" id="${id}" textLength=${textLength}`);
          }
        });
      }

      // Try to find main content with multiple strategies
      // Site-specific selectors first
      const contentSelectors = isTechCrunch ? [
        // TechCrunch-specific selectors
        ".article-content",
        ".article__content",
        ".article-content-wrapper",
        "article .article-content",
        ".entry-content",
        "article .entry-content",
        // Fallback to generic
        ".post-content",
        ".blog-post-content",
        "main article",
        "article .content",
        ".content",
        "article",
        "[role='article']",
        ".post-body",
        ".article-body",
      ] : isCSSTricks ? [
        // CSS-Tricks-specific selectors - updated for current site structure
        ".article-content",
        ".entry-content",
        ".post-content",
        ".article-body",
        "article .article-content",
        "article .entry-content",
        "article .post-content",
        "article .article-body",
        "main article .article-content",
        "main article .entry-content",
        "main .article-content",
        "main article",
        "article",
        "[role='article']",
        ".content",
        ".post-body",
        ".article-entry",
        "[class*='article-content']",
        "[class*='entry-content']",
        "[class*='post-content']",
        // Try to find main content area
        ".article-wrapper",
        ".post-wrapper",
        "[class*='article-wrapper']",
      ] : isHubSpot ? [
        // HubSpot-specific selectors - comprehensive list
        "#hsg-post-content",
        "#blog-post-content",
        "#post-content",
        "#article-content",
        ".hsg-post-content",
        ".blog-post-content",
        ".post-content",
        ".article-content",
        ".entry-content",
        "[id*='post-content']",
        "[id*='article-content']",
        "[class*='hsg-post-content']",
        "[class*='blog-post-content']",
        "[class*='post-content']:not(.post-content-meta)",
        "[class*='article-content']",
        "[class*='entry-content']",
        "article .hsg-post-content",
        "article .blog-post-content",
        "article .post-content",
        "article .article-content",
        "article .entry-content",
        "main article .hsg-post-content",
        "main article .blog-post-content",
        "main article .post-content",
        "main article .article-content",
        "main .post-content",
        "main .blog-post-content",
        "[data-content='post']",
        "[data-content='article']",
        "main article",
        "article",
        ".article-body",
        ".post-body",
        ".content-body",
        "[role='article'] .post-content",
        "[role='article'] .article-content",
        "[role='article']",
        ".content:not(.content-header):not(.content-footer)",
        "[class*='content']:not([class*='header']):not([class*='footer']):not([class*='meta'])",
        "main",
        ".main-content",
        "#main-content"
      ] : isAhrefs ? [
        // Ahrefs-specific selectors - try multiple possible structures
        ".post-body",
        ".post-content",
        ".post-body-content",
        ".article-body",
        ".article-content",
        ".entry-content",
        ".blog-post-content",
        ".blog-content",
        "[class*='post-body']",
        "[class*='post-content']",
        "[class*='article-body']",
        "[class*='article-content']",
        "article .post-body",
        "article .post-content",
        "article .article-content",
        "article .entry-content",
        "main article .post-body",
        "main article .post-content",
        "main .post-content",
        "main article",
        "main .content",
        ".content-wrapper",
        "[class*='content']",
        "article",
        "[role='article']",
        ".content",
        ".article-body",
      ] : [
        // Generic selectors for other sites
        ".post-content",
        ".article-content",
        ".entry-content",
        ".blog-post-content",
        ".hsg-post-content",
        "main article",
        "article .content",
        ".content",
        "article",
        "[role='article']",
        ".post-body",
        ".article-body",
      ];

      // Extract featured/cover image from full post page (better quality)
      let featuredImage = 
        $("meta[property='og:image']").attr("content") ||
        $("meta[name='twitter:image']").attr("content") ||
        $("meta[property='og:image:secure_url']").attr("content") ||
        $("link[rel='image_src']").attr("href") ||
        "";

      // Try to find large featured image in content
      if (!featuredImage) {
        const $featuredImg = $(".featured-image img, .cover-image img, .hero-image img, .post-cover img, article img[width][height]").first();
        if ($featuredImg.length) {
          featuredImage = $featuredImg.attr("src") || 
                         $featuredImg.attr("data-src") ||
                         $featuredImg.attr("data-lazy-src") ||
                         "";
        }
      }

      // Make featured image URL absolute
      if (featuredImage && !featuredImage.startsWith("http")) {
        try {
          featuredImage = new URL(featuredImage, url).href;
        } catch {
          featuredImage = "";
        }
      }

      for (const selector of contentSelectors) {
        const $content = $(selector).first();
        
        // For TechCrunch, exclude related articles and navigation sections
        if (isTechCrunch) {
          // Remove related articles, navigation, and "Headlines Only" sections
          $content.find(".related-articles, .river-block, .river, .headlines-only, .more-articles, nav, .navigation, .article-nav").remove();
          // Remove elements that contain only links (likely navigation)
          $content.find("ul, ol").each((_, el) => {
            const $list = $(el);
            const linkCount = $list.find("a").length;
            const itemCount = $list.find("li").length;
            // If most items are links, it's probably navigation
            if (linkCount > 0 && linkCount / itemCount > 0.8) {
              $list.remove();
            }
          });
        }
        
        // For CSS-Tricks, remove ads, newsletter signups, and related content
        if (isCSSTricks) {
          $content.find(".ad, .advertisement, .newsletter, .related-posts, .author-box, .comments, .wp-block-group, aside, .sidebar, .newsletter-signup, .email-signup, .subscribe, nav, .navigation, .breadcrumb, header, footer, .social-share, .share-widget").remove();
          // Remove promotional elements
          $content.find("[class*='cta'], [class*='signup'], [class*='newsletter'], [class*='promo'], [class*='ad-']").remove();
          // Keep code blocks in CSS-Tricks articles (they're important content)
          // Only remove code blocks if they're clearly outside the main content
        }
        
        // For Ahrefs, remove ads, CTA boxes, and related content
        if (isAhrefs) {
          $content.find(".ad, .advertisement, .cta-box, .cta, .related-posts, .author-box, .comments, aside, .sidebar, .newsletter-signup, .social-share, .signup, .subscribe, .email-signup").remove();
          // Remove elements that are likely navigation or non-content
          $content.find("nav, .navigation, .breadcrumb, .post-meta, .article-meta, header, footer").remove();
          // Remove common Ahrefs promotional elements
          $content.find("[class*='cta'], [class*='signup'], [class*='newsletter'], [class*='promo'], [class*='ad-']").remove();
        }
        
        // For HubSpot, remove ads, CTAs, and promotional content (but be careful not to remove main content)
        if (isHubSpot) {
          // Remove only promotional elements, not the main content structure
          $content.find(".ad, .advertisement, .cta-box, .hsg-cta-box, .related-posts, .comments-section, aside.sidebar, .newsletter-signup, .email-signup, .social-share-widget, nav, .navigation, header.site-header, footer.site-footer, .promo-banner, .promotion-banner").remove();
          // Remove HubSpot-specific promotional elements (be selective)
          $content.find("[class*='hsg-cta-box'], [class*='cta-box'], [class*='newsletter-signup'], [class*='email-signup'], [class*='promo-banner']").remove();
          // Remove HubSpot forms and widgets (but keep content)
          $content.find("iframe[src*='hubspot'], iframe[src*='forms'], .hs-form-wrapper, [class*='hsg-form-wrapper']").remove();
          // Remove author box if it's separate from content
          $content.find(".author-box:not(.author-box-inline)").remove();
          // Remove breadcrumbs
          $content.find(".breadcrumb, .breadcrumbs, nav[aria-label='Breadcrumb']").remove();
        }
        
        const content = $content.html();
        const textContent = $content.text().trim();
        const textLength = textContent.length;
        
        // For HubSpot, be more lenient - check both HTML and text content
        const minContentLength = isHubSpot ? 500 : 300; // Higher threshold for HubSpot since it should have full content
        const minTextLength = isHubSpot ? 400 : 200;
        
        if (content && content.length > minContentLength) {
          // Clean the content using the content cleaning engine
          const cleanedContent = cleanArticleContent(content, isTechCrunch || isCSSTricks || isAhrefs || isHubSpot);
          const cleanedText = cleanedContent.replace(/<[^>]*>/g, "").trim();
          const cleanedTextLength = cleanedText.length;
          
          if (cleanedContent && cleanedTextLength > minTextLength) {
            if (isHubSpot) {
              console.log(`[HubSpot] ✓ Extracted content using selector "${selector}": ${cleanedTextLength} chars text, ${cleanedContent.length} chars HTML`);
            }
            return {
              content: cleanedContent || "",
              featuredImage: featuredImage || undefined,
            };
          } else if (isHubSpot) {
            console.log(`[HubSpot] ⚠️ Selector "${selector}" found content but too short after cleaning: ${cleanedTextLength} chars text (need ${minTextLength}+)`);
          }
        } else if (isHubSpot && content) {
          console.log(`[HubSpot] ⚠️ Selector "${selector}" found short content: ${content.length} chars HTML, ${textLength} chars text`);
        }
      }

      // Ahrefs-specific fallback: try multiple strategies
      if (isAhrefs) {
        // Strategy 1: Try to find content by looking for main article structure
        const $article = $("article, main, [role='main'], .main-content").first();
        if ($article.length > 0) {
          // Remove unwanted elements
          $article.find(".ad, .advertisement, .cta-box, .cta, .related-posts, .author-box, .comments, aside, .sidebar, .newsletter-signup, .social-share, nav, .navigation, .breadcrumb, header, footer, [class*='cta'], [class*='signup'], [class*='promo']").remove();
          
          // Try to find the actual content wrapper
          const $contentWrapper = $article.find("[class*='post'], [class*='article'], [class*='content'], .prose, .post-body, .post-content").first();
          const articleContent = $contentWrapper.length > 0 ? $contentWrapper.html() : $article.html();
          
          if (articleContent && articleContent.length > 300) {
            const cleanedContent = cleanArticleContent(articleContent, true);
          if (cleanedContent && cleanedContent.length > 200) {
            return {
              content: cleanedContent || "",
              featuredImage: featuredImage || undefined,
            };
            }
          }
        }
        
        // Strategy 2: Try to extract paragraphs that form the article
        const $allParas = $("p").filter((_, el) => {
          const $p = $(el);
          const text = $p.text().trim();
          // Exclude very short paragraphs, mostly links, or meta information
          if (text.length < 50) return false;
          const linkCount = $p.find("a").length;
          if (linkCount > 2 && text.length < 200) return false; // Likely navigation
          // Check if paragraph is in a content area
          const parents = $p.parents().map((_, p) => $(p).attr("class") || "").get().join(" ");
          if (parents.includes("nav") || parents.includes("header") || parents.includes("footer") || parents.includes("sidebar")) return false;
          return true;
        });
        
        if ($allParas.length > 5) {
          const paragraphs = $allParas.map((_, el) => $(el).html()).get().join("");
          if (paragraphs && paragraphs.length > 500) {
            const cleanedContent = cleanArticleContent(`<div>${paragraphs}</div>`, true);
            if (cleanedContent && cleanedContent.length > 200) {
              return {
                content: cleanedContent || "",
                featuredImage: featuredImage || undefined,
              };
            }
          }
        }
        
        // Strategy 3: Try to get content from common article structures
        const contentSelectors2 = [
          "[class*='post'] [class*='content']",
          "[class*='article'] [class*='body']",
          "main [class*='content']",
          ".prose",
          "[data-testid*='content']",
          "[data-testid*='article']",
          "[itemprop='articleBody']",
        ];
        
        for (const selector of contentSelectors2) {
          const $content2 = $(selector).first();
          if ($content2.length > 0) {
            $content2.find(".ad, .advertisement, .cta, aside, nav, header, footer, [class*='signup'], [class*='promo']").remove();
            const content2 = $content2.html();
            if (content2 && content2.length > 300) {
              const cleanedContent = cleanArticleContent(content2, true);
              if (cleanedContent && cleanedContent.length > 200) {
                return {
                  content: cleanedContent || "",
                  featuredImage: featuredImage || undefined,
                };
              }
            }
          }
        }
      }

      // HubSpot-specific fallback: try multiple strategies with more aggressive extraction
      if (isHubSpot) {
        console.log(`[HubSpot] Starting fallback strategies for: ${validUrl}`);
        
        // Strategy 1: Try article tag with HubSpot cleaning (more lenient)
        const $article = $("article").first();
        if ($article.length > 0) {
          const articleTextBefore = $article.text().trim().length;
          // Remove only obvious non-content elements
          $article.find(".ad, .advertisement, .cta-box, .hsg-cta-box, .related-posts, .comments-section, aside.sidebar, nav, header.site-header, footer.site-footer, iframe[src*='hubspot'], .hs-form-wrapper").remove();
          const articleContent = $article.html();
          const articleTextAfter = $article.text().trim().length;
          if (articleContent && articleTextAfter > 500) { // Require substantial text
            const cleanedContent = cleanArticleContent(articleContent, true);
            const cleanedText = cleanedContent.replace(/<[^>]*>/g, "").trim();
            if (cleanedText.length > 400) {
              console.log(`[HubSpot] ✓ Strategy 1: Extracted ${cleanedText.length} chars from article tag`);
              return {
                content: cleanedContent || "",
                featuredImage: featuredImage || undefined,
              };
            }
          }
        }
        
        // Strategy 2: Try main content area (more comprehensive)
        const $main = $("main, .main-content, #main-content").first();
        if ($main.length > 0) {
          const mainTextBefore = $main.text().trim().length;
          // Remove only obvious non-content
          $main.find(".ad, .advertisement, .cta-box, aside.sidebar, nav, header.site-header, footer.site-footer, iframe[src*='hubspot'], .hs-form-wrapper").remove();
          // Try to find the main content block within main
          const $mainContent = $main.find("[class*='content'], [class*='post'], [class*='article'], article").first();
          const target = $mainContent.length > 0 ? $mainContent : $main;
          const mainContent = target.html();
          const mainTextAfter = target.text().trim().length;
          if (mainContent && mainTextAfter > 500) {
            const cleanedContent = cleanArticleContent(mainContent, true);
            const cleanedText = cleanedContent.replace(/<[^>]*>/g, "").trim();
            if (cleanedText.length > 400) {
              console.log(`[HubSpot] ✓ Strategy 2: Extracted ${cleanedText.length} chars from main content area`);
              return {
                content: cleanedContent || "",
                featuredImage: featuredImage || undefined,
              };
            }
          }
        }
        
        // Strategy 3: Extract paragraphs that form the article (more aggressive)
        const $allParas = $("p").filter((_, el) => {
          const $p = $(el);
          const text = $p.text().trim();
          // Exclude very short paragraphs, mostly links, or meta information
          if (text.length < 50) return false; // Increased minimum
          const linkCount = $p.find("a").length;
          // Allow more links if paragraph is long enough
          if (linkCount > 3 && text.length < 200) return false; // Likely navigation
          // Check if paragraph is in a content area (exclude nav/header/footer)
          const parents = $p.parents().map((_, p) => {
            const classes = $(p).attr("class") || "";
            const id = $(p).attr("id") || "";
            const tag = $(p).prop("tagName")?.toLowerCase() || "";
            return `${classes} ${id} ${tag}`;
          }).get().join(" ").toLowerCase();
          
          // Exclude if in navigation/header/footer/sidebar
          if (parents.includes("nav") || parents.includes("header.site-header") || parents.includes("footer.site-footer") || 
              parents.includes("aside.sidebar") || parents.includes("breadcrumb") || 
              (parents.includes("cta-box") && text.length < 300)) {
            return false;
          }
          // Include if in article/main/content areas
          if (parents.includes("article") || parents.includes("main") || 
              parents.includes("content") || parents.includes("post-content")) {
            return true;
          }
          // Default: include if text is substantial
          return text.length > 100;
        });
        
        if ($allParas.length > 3) {
          const paragraphs = $allParas.map((_, el) => {
            const $p = $(el);
            // Wrap in div to preserve structure
            return `<p>${$p.html()}</p>`;
          }).get().join("");
          const totalText = $allParas.map((_, el) => $(el).text().trim()).get().join(" ").length;
          if (paragraphs && totalText > 600) { // Require at least 600 chars of text
            const cleanedContent = cleanArticleContent(`<div>${paragraphs}</div>`, true);
            const cleanedText = cleanedContent.replace(/<[^>]*>/g, "").trim();
            if (cleanedText.length > 400) {
              console.log(`[HubSpot] ✓ Strategy 3: Extracted ${cleanedText.length} chars from ${$allParas.length} paragraphs`);
              return {
                content: cleanedContent || "",
                featuredImage: featuredImage || undefined,
              };
            }
          }
        }
        
        // Strategy 4: Try to find the largest content block (more comprehensive)
        const allDivs = $("div").filter((_, el) => {
          const $div = $(el);
          const text = $div.text().trim();
          // Look for divs with substantial text content
          if (text.length < 800 || text.length > 100000) return false; // Reasonable article length
          
          // Exclude obvious non-content containers
          const classes = ($div.attr("class") || "").toLowerCase();
          const id = ($div.attr("id") || "").toLowerCase();
          const combined = `${classes} ${id}`;
          
          if (combined.includes("nav") || combined.includes("header") || combined.includes("footer") || 
              combined.includes("sidebar") || combined.includes("ad-container") || 
              combined.includes("promo-banner") || combined.includes("cta-box")) {
            return false;
          }
          
          // Prefer content-related classes
          if (combined.includes("content") || combined.includes("post") || combined.includes("article") ||
              combined.includes("entry") || combined.includes("body")) {
            return true;
          }
          
          // Default: include if it has substantial text and is likely content
          return text.length > 1000;
        }).toArray().sort((a, b) => {
          // Sort by text length descending
          return $(b).text().trim().length - $(a).text().trim().length;
        });
        
        if (allDivs.length > 0) {
          // Try top 3 largest divs
          for (let i = 0; i < Math.min(3, allDivs.length); i++) {
            const $largestDiv = $(allDivs[i]);
            const textBefore = $largestDiv.text().trim().length;
            
            // Remove only obvious non-content
            $largestDiv.find(".ad, .advertisement, .cta-box, nav, aside.sidebar, header.site-header, footer.site-footer, iframe[src*='hubspot']").remove();
            const divContent = $largestDiv.html();
            const textAfter = $largestDiv.text().trim().length;
            
            if (divContent && textAfter > 600) {
              const cleanedContent = cleanArticleContent(divContent, true);
              const cleanedText = cleanedContent.replace(/<[^>]*>/g, "").trim();
              if (cleanedText.length > 400) {
                console.log(`[HubSpot] ✓ Strategy 4: Extracted ${cleanedText.length} chars from largest div #${i+1}`);
                return {
                  content: cleanedContent || "",
                  featuredImage: featuredImage || undefined,
                };
              }
            }
          }
        }
        
        // Debug logging for HubSpot when all strategies fail
        const allText = $.text().trim();
        const articleCount = $("article").length;
        const mainCount = $("main").length;
        const hsgContentCount = $("[class*='hsg-post-content'], [class*='blog-post-content']").length;
        console.log(`[HubSpot Debug] ❌ Failed to extract content from: ${validUrl}`);
        console.log(`[HubSpot Debug] Page stats: ${allText.length} total chars, ${articleCount} articles, ${mainCount} main tags, ${hsgContentCount} hsg-post-content/blog-post-content elements`);
      }
      
      // CSS-Tricks-specific fallback: try multiple strategies
      if (isCSSTricks) {
        // Strategy 1: Try article tag with CSS-Tricks cleaning
        const $article = $("article").first();
        if ($article.length > 0) {
          $article.find(".ad, .advertisement, .newsletter, .related-posts, .author-box, .comments, .wp-block-group, aside, .sidebar, nav, .navigation, header, footer").remove();
          const articleContent = $article.html();
          if (articleContent && articleContent.length > 300) {
            const cleanedContent = cleanArticleContent(articleContent, true);
            if (cleanedContent && cleanedContent.length > 200) {
              console.log(`[CSS-Tricks] Extracted content from article tag (${cleanedContent.length} chars)`);
              return {
                content: cleanedContent || "",
                featuredImage: featuredImage || undefined,
              };
            }
          }
        }
        
        // Strategy 2: Try main content area
        const $main = $("main, .main-content, #main-content").first();
        if ($main.length > 0) {
          $main.find(".ad, .advertisement, .newsletter, aside, nav, header, footer, .sidebar").remove();
          const mainContent = $main.html();
          if (mainContent && mainContent.length > 300) {
            const cleanedContent = cleanArticleContent(mainContent, true);
            if (cleanedContent && cleanedContent.length > 200) {
              console.log(`[CSS-Tricks] Extracted content from main tag (${cleanedContent.length} chars)`);
              return {
                content: cleanedContent || "",
                featuredImage: featuredImage || undefined,
              };
            }
          }
        }
        
        // Strategy 3: Extract paragraphs that form the article
        const $allParas = $("p").filter((_, el) => {
          const $p = $(el);
          const text = $p.text().trim();
          // Exclude very short paragraphs, mostly links, or meta information
          if (text.length < 30) return false;
          const linkCount = $p.find("a").length;
          if (linkCount > 2 && text.length < 150) return false; // Likely navigation
          // Check if paragraph is in a content area
          const parents = $p.parents().map((_, p) => $(p).attr("class") || "").get().join(" ").toLowerCase();
          if (parents.includes("nav") || parents.includes("header") || parents.includes("footer") || 
              parents.includes("sidebar") || parents.includes("breadcrumb") || parents.includes("meta")) {
            return false;
          }
          return true;
        });
        
        if ($allParas.length > 5) {
          const paragraphs = $allParas.map((_, el) => $(el).html()).get().join("");
          if (paragraphs && paragraphs.length > 500) {
            const cleanedContent = cleanArticleContent(`<div>${paragraphs}</div>`, true);
            if (cleanedContent && cleanedContent.length > 200) {
              console.log(`[CSS-Tricks] Extracted content from ${$allParas.length} paragraphs (${cleanedContent.length} chars)`);
              return {
                content: cleanedContent || "",
                featuredImage: featuredImage || undefined,
              };
            }
          }
        }
        
        // Strategy 4: Try to find the largest content block
        const allDivs = $("div").filter((_, el) => {
          const $div = $(el);
          const text = $div.text().trim();
          // Look for divs with substantial text content
          return text.length > 1000 && text.length < 50000; // Reasonable article length
        }).toArray().sort((a, b) => {
          // Sort by text length descending
          return $(b).text().trim().length - $(a).text().trim().length;
        });
        
        if (allDivs.length > 0) {
          const $largestDiv = $(allDivs[0]);
          // Check if it's not a navigation or promotional element
          const classes = ($largestDiv.attr("class") || "").toLowerCase();
          if (!classes.includes("nav") && !classes.includes("header") && !classes.includes("footer") && 
              !classes.includes("sidebar") && !classes.includes("ad") && !classes.includes("promo")) {
            $largestDiv.find(".ad, .advertisement, .cta, nav, .navigation, aside, .sidebar, header, footer").remove();
            const divContent = $largestDiv.html();
            if (divContent && divContent.length > 500) {
              const cleanedContent = cleanArticleContent(divContent, true);
              if (cleanedContent && cleanedContent.length > 200) {
                console.log(`[CSS-Tricks] Extracted content from largest div (${cleanedContent.length} chars)`);
                return {
                  content: cleanedContent || "",
                  featuredImage: featuredImage || undefined,
                };
              }
            }
          }
        }
      }

      // Fallback: try to get article tag content (with TechCrunch-specific cleaning)
      if (isTechCrunch) {
        // For TechCrunch, be more selective - get article but exclude river blocks
        const $article = $("article").first();
        $article.find(".river-block, .river, .headlines-only, .more-articles, nav").remove();
        const articleContent = $article.html();
        if (articleContent && articleContent.length > 300) {
          const cleanedContent = cleanArticleContent(articleContent, true);
          if (cleanedContent && cleanedContent.length > 200) {
            return {
              content: cleanedContent || "",
              featuredImage: featuredImage || undefined,
            };
          }
        }
      } else if (!isCSSTricks && !isHubSpot) {
        // Only try generic article fallback if not CSS-Tricks or HubSpot (already handled above)
        const articleContent = $("article").first().html();
        if (articleContent && articleContent.length > 300) {
          const cleanedContent = cleanArticleContent(articleContent);
          if (cleanedContent && cleanedContent.length > 200) {
            return {
              content: cleanedContent || "",
              featuredImage: featuredImage || undefined,
            };
          }
        }
      }

      // More aggressive fallback: try main content area (skip if CSS-Tricks or HubSpot already handled)
      if (!isCSSTricks && !isHubSpot) {
      const $main = $("main, .main-content, #main-content, .content-area").first();
      if (isTechCrunch) {
        $main.find(".river-block, .river, .headlines-only, .more-articles, nav").remove();
      }
      const mainContent = $main.html();
      if (mainContent && mainContent.length > 300) {
        const cleanedContent = cleanArticleContent(mainContent, isTechCrunch);
        if (cleanedContent && cleanedContent.length > 200) {
          return {
            content: cleanedContent || "",
            featuredImage: featuredImage || undefined,
          };
          }
        }
      }

      // Debug logging for CSS-Tricks
      if (isCSSTricks) {
        const allText = $.text().trim();
        const articleCount = $("article").length;
        const mainCount = $("main").length;
        const contentElements = $("[class*='content'], [class*='entry'], [class*='article']").length;
        
        console.log(`[CSS-Tricks Debug] ❌ Failed to extract content from: ${validUrl}`);
        console.log(`[CSS-Tricks Debug] Page stats: ${allText.length} total chars, ${articleCount} articles, ${mainCount} main tags, ${contentElements} content elements`);
        
        // Try to provide helpful diagnostics
        if (articleCount === 0 && mainCount === 0) {
          console.log(`[CSS-Tricks Debug] ⚠️ No article or main tags found - page structure may be different`);
        }
        if (allText.length < 100) {
          console.log(`[CSS-Tricks Debug] ⚠️ Very little text on page - might be JavaScript-rendered or error page`);
        }
      }

      // Last resort: try to get paragraph content (but exclude navigation paragraphs)
      if (isTechCrunch) {
        // Get paragraphs that are in article content areas
        const $articleParas = $("article p, .article-content p, .entry-content p").filter((_, el) => {
          const $p = $(el);
          const text = $p.text().trim();
          const linkCount = $p.find("a").length;
          // Exclude paragraphs that are mostly links or very short
          return text.length > 100 && linkCount < 3;
        });
        const paragraphs = $articleParas.map((_, el) => $(el).html()).get().join("");
        if (paragraphs && paragraphs.length > 300) {
          const cleanedContent = cleanArticleContent(`<div>${paragraphs}</div>`, true);
          if (cleanedContent && cleanedContent.length > 200) {
            return {
              content: cleanedContent || "",
              featuredImage: featuredImage || undefined,
            };
          }
        }
      } else if (isAhrefs) {
        // For Ahrefs, try a more aggressive paragraph extraction
        // Get all paragraphs and filter intelligently
        const $articleParas = $("p").filter((_, el) => {
          const $p = $(el);
          const text = $p.text().trim();
          // Skip very short paragraphs
          if (text.length < 30) return false;
          // Skip paragraphs that are mostly links
          const linkCount = $p.find("a").length;
          if (linkCount > 1 && text.length < 150) return false;
          // Skip if in navigation or header/footer
          const $parent = $p.parents();
          const parentClasses = $parent.map((_, p) => $(p).attr("class") || "").get().join(" ").toLowerCase();
          if (parentClasses.includes("nav") || parentClasses.includes("header") || parentClasses.includes("footer") || 
              parentClasses.includes("sidebar") || parentClasses.includes("breadcrumb") || parentClasses.includes("meta")) {
            return false;
          }
          return true;
        });
        
        if ($articleParas.length >= 3) {
          const paragraphs = $articleParas.map((_, el) => $(el).html()).get().join("");
          if (paragraphs && paragraphs.length > 500) {
            const cleanedContent = cleanArticleContent(`<div>${paragraphs}</div>`, true);
            if (cleanedContent && cleanedContent.length > 200) {
              console.log(`[Ahrefs] Extracted content from ${$articleParas.length} paragraphs (${cleanedContent.length} chars)`);
              return {
                content: cleanedContent || "",
                featuredImage: featuredImage || undefined,
              };
            }
          }
        }
        
        // Last resort for Ahrefs: try to find the largest content block
        const allDivs = $("div").filter((_, el) => {
          const $div = $(el);
          const text = $div.text().trim();
          // Look for divs with substantial text content
          return text.length > 1000 && text.length < 50000; // Reasonable article length
        }).toArray().sort((a, b) => {
          // Sort by text length descending
          return $(b).text().trim().length - $(a).text().trim().length;
        });
        
        if (allDivs.length > 0) {
          const $largestDiv = $(allDivs[0]);
          // Check if it's not a navigation or promotional element
          const classes = ($largestDiv.attr("class") || "").toLowerCase();
          if (!classes.includes("nav") && !classes.includes("header") && !classes.includes("footer") && 
              !classes.includes("sidebar") && !classes.includes("ad") && !classes.includes("promo")) {
            $largestDiv.find(".ad, .advertisement, .cta, nav, .navigation, aside, .sidebar, header, footer").remove();
            const divContent = $largestDiv.html();
            if (divContent && divContent.length > 500) {
              const cleanedContent = cleanArticleContent(divContent, true);
              if (cleanedContent && cleanedContent.length > 200) {
                console.log(`[Ahrefs] Extracted content from largest div (${cleanedContent.length} chars)`);
                return {
                  content: cleanedContent || "",
                  featuredImage: featuredImage || undefined,
                };
              }
            }
          }
        }
      } else {
        const paragraphs = $("p").map((_, el) => $(el).html()).get().join("");
        if (paragraphs && paragraphs.length > 300) {
          const cleanedContent = cleanArticleContent(`<div>${paragraphs}</div>`);
          if (cleanedContent && cleanedContent.length > 200) {
            return {
              content: cleanedContent || "",
              featuredImage: featuredImage || undefined,
            };
          }
        }
      }
      
      // Final logging if no content found
      if (isAhrefs) {
        const allText = $.text().trim();
        console.log(`[Ahrefs Debug] Failed to extract content. Page has ${allText.length} characters of total text.`);
        console.log(`[Ahrefs Debug] Available selectors: article=${$("article").length}, main=${$("main").length}, [class*='content']=${$("[class*='content']").length}`);
      }

      return { content: "", featuredImage: featuredImage || undefined };
    } catch (error) {
      console.error(`Error scraping full post ${url}:`, error);
      return { content: "", featuredImage: undefined };
    }
  }
}

