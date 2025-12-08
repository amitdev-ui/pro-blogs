import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BlogScraper } from "@/lib/scraper";
import { websiteConfigs } from "@/lib/scraper/configs";
import { updateProgress, isCancelled } from "@/lib/scraper/progress-store";
import { cleanArticleContent } from "@/lib/scraper/content-cleaner";
import { rewriteForSEO } from "@/lib/scraper/seo-rewriter";
import { getPageLimit, increasePageLimit } from "@/lib/scraper/page-limit-manager";

export async function POST(request: NextRequest) {
  const sessionId = `scrape-${Date.now()}`;
  
  try {
    const body = await request.json();
    const { websiteId } = body;

    if (!websiteId) {
      return NextResponse.json(
        { error: "Website ID is required" },
        { status: 400 }
      );
    }

    // Return immediately and run scraper in background
    // This prevents timeout issues
    // Don't await - let it run in background
    runScraperInBackground(sessionId, websiteId).catch((error) => {
      console.error("Unhandled error in background scraper:", error);
      updateProgress(sessionId, {
        status: 'error',
        message: `Unhandled error: ${String(error)}`,
        endTime: new Date(),
      });
    });

    return NextResponse.json({
      success: true,
      message: "Scraping started",
      sessionId,
    });
  } catch (error) {
    console.error("Error starting scraper:", error);
    return NextResponse.json(
      { error: "Failed to start scraping", details: String(error) },
      { status: 500 }
    );
  }
}

async function runScraperInBackground(sessionId: string, websiteId: string) {
  try {

    // Get website from database
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      updateProgress(sessionId, {
        status: 'error',
        message: 'Website not found',
        endTime: new Date(),
      });
      return;
    }

    // Parse selectors from JSON
    let selectors;
    try {
      selectors = typeof website.selectors === "string"
        ? JSON.parse(website.selectors)
        : website.selectors;
    } catch (parseError) {
      console.error("Error parsing selectors:", parseError);
      updateProgress(sessionId, {
        status: 'error',
        message: `Error parsing website selectors: ${parseError}`,
        endTime: new Date(),
      });
      return;
    }

    // Get dynamic page limit for this website (auto-adjusts when needed)
    const pageLimit = getPageLimit(website.id, 'main');
    
    // Create scraper config
    const config = {
      name: website.name,
      url: website.url,
      selectors,
      pagination: {
        type: "next-page" as const,
        maxPages: pageLimit, // Dynamic limit - auto-increases when all posts are duplicates
      },
    };

    const scraper = new BlogScraper(config);

    // Update progress: Starting
    try {
      updateProgress(sessionId, {
        status: 'running',
        websiteId: website.id,
        websiteName: website.name,
        message: `Starting scrape for ${website.name}...`,
        startTime: new Date(),
        postsScraped: 0,
        errors: []
      });
    } catch (progressError) {
      console.error("Error updating progress:", progressError);
    }

    // Update progress: Scraping listing page
    try {
      updateProgress(sessionId, {
        message: `Scraping listing page: ${website.url}...`,
      });
    } catch (progressError) {
      console.error("Error updating progress:", progressError);
    }

    // Scrape the website listing page with dynamic page limit
    updateProgress(sessionId, {
      message: `Scraping listing pages (up to ${pageLimit} pages to find new posts)...`,
    });
    
    const posts = await scraper.scrapePage(website.url);

    // Check if cancelled after scraping page
    if (isCancelled(sessionId)) {
      updateProgress(sessionId, {
        message: `Scraping cancelled before processing posts.`,
      });
      return;
    }

    // Update progress: Found posts
    try {
      if (posts.length === 0) {
        updateProgress(sessionId, {
          message: `⚠️ No posts found! The selectors may not match the current website structure. Please check and update the selectors.`,
          totalPosts: 0,
          currentPost: 0,
          errors: ["No posts found - selectors may need updating"]
        });
      } else {
        updateProgress(sessionId, {
          message: `Found ${posts.length} posts. Processing...`,
          totalPosts: posts.length,
          currentPost: 0,
        });
      }
    } catch (progressError) {
      console.error("Error updating progress:", progressError);
    }

    // If no posts found, complete with error message
    if (posts.length === 0) {
      updateProgress(sessionId, {
        status: 'error',
        message: `❌ No posts found from ${website.name}. The website selectors may be outdated or incorrect. Please check the selectors in the admin panel and update them to match the current HTML structure.`,
        endTime: new Date(),
        errors: [`No posts found. Website: ${website.url}. Selectors may need updating.`]
      });
      
      // Log the issue
      await prisma.log.create({
        data: {
          websiteId: website.id,
          message: `Scraping failed: No posts found. Selectors may need updating for ${website.url}`,
          status: "error",
        },
      }).catch(() => {}); // Ignore log errors
      
      console.log(`[Scraper] No posts found for ${website.name}. Selectors may need updating.`);
      return;
    }

    // Save posts to database
    const savedPosts = [];
    let newPostsCount = 0;
    let updatedPostsCount = 0;
    let skippedShort = 0;
    let skippedDuplicate = 0;
    let skippedError = 0;
    const errors: string[] = [];
    const MAX_NEW_POSTS_PER_RUN = 500; // Limit only NEW posts, not updates
    let limitReached = false;
    
    for (let i = 0; i < posts.length; i++) {
      // Stop if we've reached our per-run limit for NEW posts only
      // Don't stop for updates - continue searching for new posts
      if (newPostsCount >= MAX_NEW_POSTS_PER_RUN) {
        limitReached = true;
        const msg = `[Scraper] Reached per-run limit of ${MAX_NEW_POSTS_PER_RUN} NEW posts. Updated ${updatedPostsCount} existing posts. Remaining posts will be scraped in future runs.`;
        console.log(msg);
        try {
          updateProgress(sessionId, {
            message: msg,
            postsScraped: savedPosts.length,
          });
        } catch {
          // ignore progress errors
        }
        break;
      }
      // Check if cancelled before processing each post
      if (isCancelled(sessionId)) {
        updateProgress(sessionId, {
          message: `Scraping cancelled. Processed ${savedPosts.length} posts before cancellation.`,
        });
        return;
      }

      const post = posts[i];
      try {
        // Update progress: Processing post
        try {
          updateProgress(sessionId, {
            currentPost: i + 1,
            message: `Processing post ${i + 1}/${posts.length}: ${post.title.substring(0, 50)}...`,
          });
        } catch (progressError) {
          // Continue even if progress update fails
        }

        // Scrape full post content if sourceUrl is available
        let fullContent = post.content || "";
        let contentScrapingFailed = false;
        
        if (post.sourceUrl && post.sourceUrl !== website.url) {
          try {
            try {
              updateProgress(sessionId, {
                message: `Scraping full content for: ${post.title.substring(0, 50)}...`,
              });
            } catch (progressError) {
              // Continue even if progress update fails
            }
            
            const scrapeResult = await scraper.scrapeFullPost(post.sourceUrl);
            const scrapedContent = scrapeResult.content || "";
            
            // Log content length for debugging
            const scrapedLength = scrapedContent.replace(/<[^>]*>/g, "").trim().length;
            if (scrapedLength === 0 || scrapedLength < 100) {
              console.log(`[Scraper] Warning: Full content scraping returned very short content (${scrapedLength} chars) for ${post.title.substring(0, 50)}... URL: ${post.sourceUrl}`);
              contentScrapingFailed = true;
            } else {
              fullContent = scrapedContent;
              console.log(`[Scraper] Successfully scraped ${scrapedLength} chars of content for: ${post.title.substring(0, 50)}...`);
            }
            
            // Update cover image with better featured image from full post if available
            if (scrapeResult.featuredImage) {
              post.coverImage = scrapeResult.featuredImage;
              // Also update thumbnail if we don't have a good one
              if (!post.thumbnail || post.thumbnail === post.coverImage) {
                post.thumbnail = scrapeResult.featuredImage;
              }
            }
            
            // Clean the content one more time to ensure it's fully cleaned
            if (fullContent && fullContent.length > 0) {
              fullContent = cleanArticleContent(fullContent);
              
              // Apply SEO rewriting to improve search visibility
              fullContent = rewriteForSEO(fullContent, {
                preserveQuotes: true,
                enhanceHeadings: true,
                addKeywords: true,
              });
              
              // Update reading time based on content
              const words = fullContent.replace(/<[^>]*>/g, "").split(/\s+/).length;
              const minutes = Math.ceil(words / 200);
              post.readingTime = `${minutes} min read`;
            }
          } catch (error) {
            contentScrapingFailed = true;
            const errorMsg = `Error scraping full content for ${post.slug}: ${error}`;
            console.error(`[Scraper] ${errorMsg}`);
            
            // Log more details about the error
            if (error instanceof Error) {
              console.error(`[Scraper] Error details: ${error.message}`);
              console.error(`[Scraper] Post URL: ${post.sourceUrl}`);
            }
            
            errors.push(errorMsg);
          }
        }

        // Enforce minimum content length (only save "real" articles)
        // Reduced minimum from 350 to 200 characters to allow more posts
        const contentToUse = fullContent || post.content || "";
        const plainTextLength = contentToUse.replace(/<[^>]*>/g, "").trim().length;
        
        if (!contentToUse || plainTextLength < 200) {
          skippedShort++;
          
          // Log detailed information about why it was skipped
          if (skippedShort === 1 || skippedShort % 50 === 0) {
            console.log(`[Scraper] Skipped ${skippedShort} posts (too short).`);
            if (skippedShort === 1) {
              console.log(`[Scraper] Example: "${post.title.substring(0, 50)}..." - Content length: ${plainTextLength} chars`);
              console.log(`[Scraper] Source URL: ${post.sourceUrl || "N/A"}`);
              console.log(`[Scraper] Full content scraping ${contentScrapingFailed ? "FAILED" : "succeeded but content too short"}`);
            }
          }
          
          // Stop processing if we've skipped too many (likely a systematic issue)
          if (skippedShort >= 100 && skippedShort % 100 === 0) {
            const warningMsg = `⚠️ Warning: Skipped ${skippedShort} posts due to short content. This may indicate an issue with content extraction. Consider checking the website's HTML structure or content selectors.`;
            console.warn(`[Scraper] ${warningMsg}`);
            updateProgress(sessionId, {
              message: warningMsg,
            });
          }
          
          continue;
        }

        // Check if post already exists by sourceUrl (more reliable than slug)
        let existing = null;
        if (post.sourceUrl) {
          existing = await prisma.post.findFirst({
            where: { sourceUrl: post.sourceUrl },
          });
        }
        
        // Fallback to slug check if sourceUrl not available
        if (!existing) {
          existing = await prisma.post.findUnique({
            where: { slug: post.slug },
          });
        }

        if (existing) {
          // Update existing post (duplicate)
          // Note: Updates don't count toward the limit - we only limit NEW posts
          skippedDuplicate++;
          if (skippedDuplicate % 50 === 0) {
            console.log(`[Scraper] Found ${skippedDuplicate} duplicates so far. Continuing to find new posts...`);
            updateProgress(sessionId, {
              message: `Found ${skippedDuplicate} duplicates, ${newPostsCount} new posts saved. Continuing...`,
            });
          }
          const updated = await prisma.post.update({
            where: { id: existing.id },
            data: {
              title: post.title,
              description: post.description || "",
              content: contentToUse,
              author: post.author || "Unknown",
              authorImage: post.authorImage || null,
              date: (post.date instanceof Date && !isNaN(post.date.getTime())) ? post.date : new Date(),
              readingTime: post.readingTime || "5 min read",
              category: post.category || null,
              tags: JSON.stringify(post.tags || []),
              thumbnail: post.thumbnail || null,
              coverImage: post.coverImage || null,
              sourceUrl: post.sourceUrl || null,
              updatedAt: new Date(),
            },
          });
          savedPosts.push(updated);
          updatedPostsCount++;
          // Note: Updates don't count toward the MAX_NEW_POSTS_PER_RUN limit
          // The limit check at the start of the loop only checks newPostsCount
        } else {
          // Create new post - ensure slug is unique
          let uniqueSlug = post.slug;
          let slugExists = await prisma.post.findUnique({
            where: { slug: uniqueSlug },
          });
          
          // If slug already exists, append a hash from sourceUrl
          if (slugExists && post.sourceUrl) {
            const urlHash = post.sourceUrl.split('/').pop()?.substring(0, 8) || Date.now().toString().slice(-6);
            uniqueSlug = `${post.slug}-${urlHash}`;
          }
          
          const created = await prisma.post.create({
            data: {
              slug: uniqueSlug,
              title: post.title,
              description: post.description || "",
              content: contentToUse,
              author: post.author || "Unknown",
              authorImage: post.authorImage || null,
              date: (post.date instanceof Date && !isNaN(post.date.getTime())) ? post.date : new Date(),
              readingTime: post.readingTime || "5 min read",
              category: post.category || null,
              tags: JSON.stringify(post.tags || []),
              thumbnail: post.thumbnail || null,
              coverImage: post.coverImage || null,
              sourceUrl: post.sourceUrl || null,
              websiteId: website.id,
            },
          });
          savedPosts.push(created);
          newPostsCount++;
        }
        
        // Update progress: Post saved
        try {
          updateProgress(sessionId, {
            postsScraped: savedPosts.length,
          });
        } catch (progressError) {
          // Continue even if progress update fails
        }
      } catch (error) {
        skippedError++;
        const errorMsg = `Error saving post ${post.slug}: ${error}`;
        if (skippedError % 10 === 0) {
          console.error(`[Scraper] ${skippedError} errors so far. Continuing...`);
        }
        errors.push(errorMsg);
      }
    }

    // Update progress: Completed
    try {
      // Auto-increase page limit if all posts were duplicates (no new posts)
      let pageLimitIncreased = false;
      let oldLimit = pageLimit;
      let newLimit = pageLimit;
      
      if (newPostsCount === 0 && savedPosts.length > 0) {
        oldLimit = pageLimit;
        newLimit = increasePageLimit(website.id, 'main');
        pageLimitIncreased = (newLimit > oldLimit);
        if (pageLimitIncreased) {
          console.log(`[Scraper] All ${savedPosts.length} posts were duplicates. Increased page limit: ${oldLimit} → ${newLimit}`);
        }
      }
      
      let message = newPostsCount > 0 
        ? `Completed! Created ${newPostsCount} new posts${updatedPostsCount > 0 ? ` and updated ${updatedPostsCount} existing posts` : ''}.`
        : `Completed! All ${updatedPostsCount} posts were already in database (updated). No new posts added.`;

      // Add page limit increase message if applicable
      if (pageLimitIncreased) {
        message += ` Page limit increased automatically for next run (${oldLimit} → ${newLimit}).`;
      }

      // Add detailed statistics
      const stats = [];
      if (skippedDuplicate > 0) stats.push(`${skippedDuplicate} duplicates`);
      if (skippedShort > 0) stats.push(`${skippedShort} too short`);
      if (skippedError > 0) stats.push(`${skippedError} errors`);
      if (stats.length > 0) {
        message += ` Skipped: ${stats.join(', ')}.`;
      }

      if (limitReached) {
        message += ` Per-run limit of ${MAX_NEW_POSTS_PER_RUN} NEW posts was reached; remaining posts will be handled by future runs or schedules.`;
      }
      
      console.log(`[Scraper] Summary: ${newPostsCount} new, ${updatedPostsCount} updated, ${skippedDuplicate} duplicates, ${skippedShort} too short, ${skippedError} errors`);
      
      updateProgress(sessionId, {
        status: 'completed',
        message,
        postsScraped: savedPosts.length,
        endTime: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (progressError) {
      console.error("Error updating progress:", progressError);
    }

    // Log the scraping activity
    try {
      const logMessage = newPostsCount > 0
        ? `Scraped ${savedPosts.length} posts from ${website.name}: ${newPostsCount} new, ${updatedPostsCount} updated${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
        : `Scraped ${website.name}: All ${updatedPostsCount} posts were duplicates (updated)${errors.length > 0 ? ` (${errors.length} errors)` : ''}`;
      
      await prisma.log.create({
        data: {
          websiteId: website.id,
          message: logMessage,
          status: errors.length > 0 ? "error" : "success",
        },
      });
    } catch (logError) {
      console.error("Error creating log:", logError);
    }

    console.log(`Scraping completed for session ${sessionId}: ${newPostsCount} new posts, ${updatedPostsCount} updated posts`);
  } catch (error) {
    console.error("Scraping error:", error);
    
    // Update progress: Error
    try {
      updateProgress(sessionId, {
        status: 'error',
        message: `Error: ${String(error)}`,
        endTime: new Date(),
      });
    } catch (progressError) {
      console.error("Error updating progress on error:", progressError);
    }
  }
}

