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

  async scrapePage(url: string): Promise<ScrapedPost[]> {
    const allPosts: ScrapedPost[] = []; // Declare outside try-catch for error recovery
    try {
      const maxPages = this.config.pagination?.maxPages || 10;
      let currentUrl = url;
      let pageCount = 0;
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3; // Stop after 3 consecutive errors

      // Scrape multiple pages if pagination is configured
      while (pageCount < maxPages) {
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
        console.log(`[Pagination] Page ${pageCount + 1}/${maxPages}: Scraped ${pagePosts.length} posts from ${currentUrl}. Total so far: ${allPosts.length}. Next: ${nextPageUrl}`);

        currentUrl = nextPageUrl;
        pageCount++;

        // Small delay between pages to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`[Pagination] Completed: Found ${allPosts.length} posts from ${pageCount} pages`);
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
          link = new URL(link, baseUrl).href;
        } catch {
          link = baseUrl;
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
      const html = await fetchHTML(url);
      const $ = cheerio.load(html);

      // Detect if this is a TechCrunch URL
      const isTechCrunch = url.includes("techcrunch.com");
      // Detect if this is a CSS-Tricks URL
      const isCSSTricks = url.includes("css-tricks.com");
      // Detect if this is an Ahrefs URL
      const isAhrefs = url.includes("ahrefs.com/blog");

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
        // CSS-Tricks-specific selectors
        ".article-content",
        ".entry-content",
        "article .article-content",
        "article .entry-content",
        ".post-content",
        "main article",
        "article",
        "[role='article']",
        ".content",
        ".article-body",
        ".post-body",
      ] : isAhrefs ? [
        // Ahrefs-specific selectors
        ".post-content",
        ".article-content",
        ".entry-content",
        "article .post-content",
        "article .article-content",
        "article .entry-content",
        "main .post-content",
        "main article",
        ".blog-post-content",
        "article",
        "[role='article']",
        ".content",
        ".article-body",
        ".post-body",
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
          $content.find(".ad, .advertisement, .newsletter, .related-posts, .author-box, .comments, .wp-block-group, aside, .sidebar").remove();
          // Remove code blocks that might be in wrong place (keep main article code)
          $content.find("pre code").parent().each((_, el) => {
            const $codeBlock = $(el);
            // Only remove if it's outside main content flow
            if ($codeBlock.closest(".article-content, .entry-content").length === 0) {
              $codeBlock.remove();
            }
          });
        }
        
        // For Ahrefs, remove ads, CTA boxes, and related content
        if (isAhrefs) {
          $content.find(".ad, .advertisement, .cta-box, .cta, .related-posts, .author-box, .comments, aside, .sidebar, .newsletter-signup, .social-share").remove();
          // Remove elements that are likely navigation or non-content
          $content.find("nav, .navigation, .breadcrumb, .post-meta").remove();
        }
        
        const content = $content.html();
        if (content && content.length > 300) { // Reduced from 500 to 300
          // Clean the content using the content cleaning engine
          const cleanedContent = cleanArticleContent(content, isTechCrunch || isCSSTricks || isAhrefs);
          
          if (cleanedContent && cleanedContent.length > 200) {
            return {
              content: cleanedContent || "",
              featuredImage: featuredImage || undefined,
            };
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
      } else {
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

      // More aggressive fallback: try main content area
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

      return { content: "", featuredImage: featuredImage || undefined };
    } catch (error) {
      console.error(`Error scraping full post ${url}:`, error);
      return { content: "", featuredImage: undefined };
    }
  }
}

