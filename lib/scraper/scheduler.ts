import cron from "node-cron";
import type { ScheduledTask as CronTask } from "node-cron";
import { prisma } from "@/lib/prisma";
import { BlogScraper } from "./scraper";
import { updateProgress } from "./progress-store";
import { cleanArticleContent } from "./content-cleaner";
import { rewriteForSEO } from "./seo-rewriter";
import { getPageLimit, increasePageLimit, SCHEDULED_PAGES_PER_RUN } from "./page-limit-manager";
import { getNextWebsiteIndex, advanceToNextWebsite } from "./scheduler-rotation";
import { getCurrentOffset, advanceOffset } from "./pagination-tracker";

interface ScheduledTask {
  task: CronTask;
  websiteId: string;
  websiteName: string;
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  runCount?: number;
}

const activeSchedules = new Map<string, ScheduledTask>();

/**
 * Start scheduled scraping for all websites sequentially
 */
async function startScheduledScrapingForAll(
  schedule: string = "0 */6 * * *"
): Promise<boolean> {
  try {
    // Stop existing "all" schedule if any
    stopScheduledScraping("all");

    // Get all websites
    const websites = await prisma.website.findMany({
      orderBy: { name: "asc" },
    });

    if (websites.length === 0) {
      throw new Error("No websites found");
    }

    // Create cron task that processes ONE website per run (500 pages each)
    // Rotates through websites sequentially each scheduled run
    const task = cron.schedule(
      schedule,
      async () => {
        // Get all websites fresh (in case new ones were added)
        const currentWebsites = await prisma.website.findMany({
          orderBy: { name: "asc" },
        });
        
        if (currentWebsites.length === 0) {
          console.log(`[Scheduler] ⚠️ No websites found to scrape.`);
          return;
        }
        
        // Get the next website in rotation (one website per scheduled run)
        const websiteIndex = getNextWebsiteIndex(currentWebsites.length);
        const website = currentWebsites[websiteIndex];
        const sessionId = `scheduled-all-${website.id}-${Date.now()}`;
        
        console.log(`[Scheduler] ⚠️ AUTO-SCHEDULER: Processing website ${websiteIndex + 1}/${currentWebsites.length}: ${website.name}`);
        console.log(`[Scheduler] ⚠️ This scheduled run will process 500 pages of ${website.name} only`);
        console.log(`[Scheduler] ⚠️ Next scheduled run will process the next website in sequence`);
        
        try {
          // Parse selectors
          let selectors;
          try {
            selectors =
              typeof website.selectors === "string"
                ? JSON.parse(website.selectors)
                : website.selectors;
          } catch {
            selectors = {};
          }

          // Fixed limit: exactly 500 pages per website per scheduled run
          // This ensures each website gets processed in sequence, not stuck on one
          // Get the current offset (how many pages already scraped) to continue from where we left off
          const currentOffset = getCurrentOffset(website.id);
          const config = {
            name: website.name,
            url: website.url,
            selectors,
            pagination: {
              type: "next-page" as const,
              maxPages: SCHEDULED_PAGES_PER_RUN, // Always 500 pages per scheduled run
            },
          };

          console.log(`[Scheduler] Website ${website.name} - Starting from page offset: ${currentOffset} (will scrape pages ${currentOffset + 1} to ${currentOffset + SCHEDULED_PAGES_PER_RUN})`);
          
          await runScheduledScrape(sessionId, website.id, config, currentOffset);
          
          // Advance offset after successful scraping (add 500 pages)
          advanceOffset(website.id);
          
          // Move to next website for next scheduled run
          advanceToNextWebsite(currentWebsites.length);
          
          const nextWebsiteIndex = (websiteIndex + 1) % currentWebsites.length;
          const nextWebsite = currentWebsites[nextWebsiteIndex];
          console.log(`[Scheduler] ✓ Completed processing ${website.name} (${SCHEDULED_PAGES_PER_RUN} pages). Next scheduled run will process: ${nextWebsite.name}`);
        } catch (error) {
          console.error(`[Scheduler] Error scraping ${website.name}:`, error);
          // Still advance to next website even if this one fails
          advanceToNextWebsite(currentWebsites.length);
        }
        
        updateScheduleStatus("all");
      },
      {
        timezone: "UTC",
      }
    );

    activeSchedules.set("all", {
      task,
      websiteId: "all",
      websiteName: "All Websites",
      schedule,
      lastRun: undefined,
      nextRun: getNextRunTime(schedule),
      runCount: 0,
    });

    console.log(`[Scheduler] Started scheduled scraping for all ${websites.length} websites (${schedule})`);
    return true;
  } catch (error) {
    console.error("Error starting scheduled scraping for all websites:", error);
    return false;
  }
}

/**
 * Start automatic scraping for a website on a schedule
 * If websiteId is "all", it will schedule scraping for all websites sequentially
 */
export async function startScheduledScraping(
  websiteId: string,
  schedule: string = "0 */6 * * *" // Every 6 hours by default
): Promise<boolean> {
  try {
    // Handle "all websites" option
    if (websiteId === "all") {
      return await startScheduledScrapingForAll(schedule);
    }

    // Stop existing schedule if any
    stopScheduledScraping(websiteId);

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      throw new Error("Website not found");
    }

    // Parse selectors
    let selectors;
    try {
      selectors =
        typeof website.selectors === "string"
          ? JSON.parse(website.selectors)
          : website.selectors;
    } catch {
      selectors = {};
    }

    // Create cron task
    const task = cron.schedule(
      schedule,
      async () => {
        const sessionId = `scheduled-${websiteId}-${Date.now()}`;
        console.log(`[Scheduler] Running scheduled scrape for ${website.name}...`);
        
        try {
          // Get dynamic page limit for this website
          const pageLimit = getPageLimit(websiteId, 'main');
          
          const config = {
            name: website.name,
            url: website.url,
            selectors,
            pagination: {
              type: "next-page" as const,
              maxPages: pageLimit,
            },
          };
          
          await runScheduledScrape(sessionId, websiteId, config);
          updateScheduleStatus(websiteId);
          console.log(`[Scheduler] Completed scheduled scrape for ${website.name}`);
        } catch (error) {
          console.error(`[Scheduler] Error scraping ${website.name}:`, error);
          updateScheduleStatus(websiteId); // Still update status even on error
        }
      },
      {
        timezone: "UTC",
      }
    );

    activeSchedules.set(websiteId, {
      task,
      websiteId,
      websiteName: website.name,
      schedule,
      lastRun: undefined,
      nextRun: getNextRunTime(schedule),
      runCount: 0,
    });

    // Update website with schedule info
    await prisma.website.update({
      where: { id: websiteId },
      data: {
        // Store schedule in a JSON field or use a separate table
        // For now, we'll just track it in memory
      },
    });

    console.log(`[Scheduler] Started scheduled scraping for ${website.name} (${schedule})`);
    return true;
  } catch (error) {
    console.error("Error starting scheduled scraping:", error);
    return false;
  }
}

/**
 * Stop automatic scraping for a website
 */
export function stopScheduledScraping(websiteId: string): boolean {
  const schedule = activeSchedules.get(websiteId);
  if (schedule) {
    schedule.task.stop();
    activeSchedules.delete(websiteId);
    console.log(`[Scheduler] Stopped scheduled scraping for ${schedule.websiteName}`);
    return true;
  }
  return false;
}

/**
 * Get all active schedules with status
 */
export function getActiveSchedules(): Array<{
  websiteId: string;
  websiteName: string;
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  runCount?: number;
}> {
  return Array.from(activeSchedules.values()).map((s) => ({
    websiteId: s.websiteId,
    websiteName: s.websiteName,
    schedule: s.schedule,
    lastRun: s.lastRun,
    nextRun: s.nextRun,
    runCount: s.runCount || 0,
  }));
}

/**
 * Update schedule status after run
 */
export function updateScheduleStatus(websiteId: string) {
  const schedule = activeSchedules.get(websiteId);
  if (schedule) {
    schedule.lastRun = new Date();
    schedule.nextRun = getNextRunTime(schedule.schedule);
    schedule.runCount = (schedule.runCount || 0) + 1;
  }
}

/**
 * Calculate next run time from cron expression
 */
function getNextRunTime(cronExpression: string): Date | undefined {
  try {
    // Simple calculation for common patterns
    // For full implementation, you'd use a cron parser library
    const now = new Date();
    const next = new Date(now);
    
    // Parse common patterns
    if (cronExpression === "0 * * * *" || cronExpression === "0 */1 * * *") {
      // Every hour
      next.setHours(next.getHours() + 1, 0, 0, 0);
    } else if (cronExpression === "0 */2 * * *") {
      next.setHours(next.getHours() + 2, 0, 0, 0);
    } else if (cronExpression === "0 */3 * * *") {
      next.setHours(next.getHours() + 3, 0, 0, 0);
    } else if (cronExpression === "0 */6 * * *") {
      next.setHours(next.getHours() + 6, 0, 0, 0);
    } else if (cronExpression === "0 */12 * * *") {
      next.setHours(next.getHours() + 12, 0, 0, 0);
    } else if (cronExpression === "0 0 * * *") {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    } else if (cronExpression === "0 0 * * 0") {
      const daysUntilSunday = (7 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilSunday);
      next.setHours(0, 0, 0, 0);
    } else {
      // Default: add 1 hour (for hourly schedule)
      next.setHours(next.getHours() + 1, 0, 0, 0);
    }
    
    return next;
  } catch {
    return undefined;
  }
}

/**
 * Run the actual scraping (same logic as manual scraping)
 * Exported for test runs
 */
export async function runScheduledScrape(
  sessionId: string,
  websiteId: string,
  config: any,
  startOffset: number = 0
) {
  try {
    // Get dynamic page limit if not provided in config
    const pageLimit = config.pagination?.maxPages || getPageLimit(websiteId, 'main');
    
    // Ensure config has pagination
    if (!config.pagination) {
      config.pagination = {
        type: "next-page" as const,
        maxPages: pageLimit,
      };
    } else {
      config.pagination.maxPages = pageLimit;
    }
    
    updateProgress(sessionId, {
      status: "running",
      websiteId,
      websiteName: config.name,
      message: `Scheduled scrape for ${config.name} (up to ${pageLimit} pages)...`,
      startTime: new Date(),
      postsScraped: 0,
      errors: [],
    });

    const scraper = new BlogScraper(config);
    // Pass startOffset to continue from where we left off (e.g., page 501 if we've already done 500)
    const posts = await scraper.scrapePage(config.url, startOffset);

    updateProgress(sessionId, {
      message: `Found ${posts.length} posts. Processing...`,
      totalPosts: posts.length,
      currentPost: 0,
    });

    const savedPosts = [];
    const errors: string[] = [];
    let newPostsCount = 0;
    let updatedPostsCount = 0;
    let skippedShort = 0;
    let skippedDuplicate = 0;
    let skippedError = 0;
    const MAX_NEW_POSTS_PER_RUN = 500; // Limit only NEW posts, not updates
    let limitReached = false;

    for (let i = 0; i < posts.length; i++) {
      // Stop if we've reached our per-run limit for NEW posts only
      // Don't stop for updates - continue searching for new posts
      if (newPostsCount >= MAX_NEW_POSTS_PER_RUN) {
        limitReached = true;
        const msg = `[Scheduler] Reached per-run limit of ${MAX_NEW_POSTS_PER_RUN} NEW posts. Updated ${updatedPostsCount} existing posts. Remaining posts will be scraped in future runs.`;
        console.log(msg);
        updateProgress(sessionId, {
          message: msg,
          postsScraped: savedPosts.length,
        });
        break;
      }

      const post = posts[i];

      try {
        updateProgress(sessionId, {
          currentPost: i + 1,
          message: `Processing post ${i + 1}/${posts.length}: ${post.title.substring(0, 50)}...`,
        });

        // Scrape full content
        let fullContent = post.content || "";
        let contentScrapingFailed = false;
        
        if (post.sourceUrl && post.sourceUrl !== config.url) {
          try {
            const scrapeResult = await scraper.scrapeFullPost(post.sourceUrl);
            const scrapedContent = scrapeResult.content || "";
            
            // Log content length for debugging
            const scrapedLength = scrapedContent.replace(/<[^>]*>/g, "").trim().length;
            if (scrapedLength === 0 || scrapedLength < 100) {
              console.log(`[Scheduler] Warning: Full content scraping returned very short content (${scrapedLength} chars) for ${post.title.substring(0, 50)}... URL: ${post.sourceUrl}`);
              contentScrapingFailed = true;
            } else {
              fullContent = scrapedContent;
              console.log(`[Scheduler] Successfully scraped ${scrapedLength} chars of content for: ${post.title.substring(0, 50)}...`);
            }

            if (scrapeResult.featuredImage) {
              post.coverImage = scrapeResult.featuredImage;
              if (!post.thumbnail || post.thumbnail === post.coverImage) {
                post.thumbnail = scrapeResult.featuredImage;
              }
            }

            if (fullContent && fullContent.length > 0) {
              fullContent = cleanArticleContent(fullContent);
              fullContent = rewriteForSEO(fullContent, {
                preserveQuotes: true,
                enhanceHeadings: true,
                addKeywords: true,
              });

              const words = fullContent.replace(/<[^>]*>/g, "").split(/\s+/).length;
              const minutes = Math.ceil(words / 200);
              post.readingTime = `${minutes} min read`;
            }
          } catch (error) {
            contentScrapingFailed = true;
            const errorMsg = `Error scraping full content for ${post.slug}: ${error}`;
            console.error(`[Scheduler] ${errorMsg}`);
            
            // Log more details about the error
            if (error instanceof Error) {
              console.error(`[Scheduler] Error details: ${error.message}`);
              console.error(`[Scheduler] Post URL: ${post.sourceUrl}`);
            }
            
            errors.push(errorMsg);
          }
        }

        // Enforce minimum content length (only save real articles)
        // Primary rule: Articles must be at least 550 words (good for SEO)
        const contentToUse = fullContent || post.content || "";
        const plainText = contentToUse.replace(/<[^>]*>/g, "").trim();
        const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
        
        const MIN_WORDS_REQUIRED = 550;
        
        if (!contentToUse || wordCount < MIN_WORDS_REQUIRED) {
          skippedShort++;
          
          // Log detailed information about why it was skipped
          if (skippedShort === 1 || skippedShort % 50 === 0) {
            console.log(`[Scheduler] Skipped ${skippedShort} posts (too short).`);
            if (skippedShort === 1) {
              console.log(`[Scheduler] Example: "${post.title.substring(0, 50)}..." - Word count: ${wordCount} words (minimum required: ${MIN_WORDS_REQUIRED} words)`);
              console.log(`[Scheduler] Source URL: ${post.sourceUrl || "N/A"}`);
              console.log(`[Scheduler] Full content scraping ${contentScrapingFailed ? "FAILED" : "succeeded but content too short (need " + MIN_WORDS_REQUIRED + "+ words)"}`);
            }
          }
          
          // Stop processing if we've skipped too many (likely a systematic issue)
          if (skippedShort >= 100 && skippedShort % 100 === 0) {
            const warningMsg = `⚠️ Warning: Skipped ${skippedShort} posts due to short content. This may indicate an issue with content extraction. Consider checking the website's HTML structure or content selectors.`;
            console.warn(`[Scheduler] ${warningMsg}`);
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
            console.log(`[Scheduler] Found ${skippedDuplicate} duplicates so far. Continuing to find new posts...`);
            updateProgress(sessionId, {
              message: `Found ${skippedDuplicate} duplicates, ${newPostsCount} new posts saved. Continuing...`,
            });
          }
          
          await prisma.post.update({
            where: { id: existing.id },
            data: {
              title: post.title,
              description: post.description || "",
              content: contentToUse,
              author: post.author || "Unknown",
              authorImage: post.authorImage || null,
              date:
                post.date instanceof Date && !isNaN(post.date.getTime())
                  ? post.date
                  : new Date(),
              readingTime: post.readingTime || "5 min read",
              category: post.category || null,
              tags: JSON.stringify(post.tags || []),
              thumbnail: post.thumbnail || null,
              coverImage: post.coverImage || null,
              sourceUrl: post.sourceUrl || null,
              updatedAt: new Date(),
            },
          });
          savedPosts.push(existing);
          updatedPostsCount++;
          // Note: Updates don't count toward the MAX_NEW_POSTS_PER_RUN limit
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
              date:
                post.date instanceof Date && !isNaN(post.date.getTime())
                  ? post.date
                  : new Date(),
              readingTime: post.readingTime || "5 min read",
              category: post.category || null,
              tags: JSON.stringify(post.tags || []),
              thumbnail: post.thumbnail || null,
              coverImage: post.coverImage || null,
              sourceUrl: post.sourceUrl || null,
              websiteId,
            },
          });
          savedPosts.push(created);
          newPostsCount++;
        }
        updateProgress(sessionId, {
          postsScraped: savedPosts.length,
        });
      } catch (error) {
        skippedError++;
        const errorMsg = `Error saving post ${post.slug}: ${error}`;
        if (skippedError % 10 === 0) {
          console.error(`[Scheduler] ${skippedError} errors so far. Continuing...`);
        }
        errors.push(errorMsg);
      }
    }

    // Auto-increase page limit if all posts were duplicates (no new posts)
    let pageLimitIncreased = false;
    let oldLimit = pageLimit;
    let newLimit = pageLimit;
    
    if (newPostsCount === 0 && savedPosts.length > 0) {
      oldLimit = pageLimit;
      newLimit = increasePageLimit(websiteId, 'main');
      pageLimitIncreased = (newLimit > oldLimit);
      if (pageLimitIncreased) {
        console.log(`[Scheduler] All ${savedPosts.length} posts were duplicates. Increased page limit: ${oldLimit} → ${newLimit}`);
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
    
    console.log(`[Scheduler] Summary: ${newPostsCount} new, ${updatedPostsCount} updated, ${skippedDuplicate} duplicates, ${skippedShort} too short, ${skippedError} errors`);
    
    updateProgress(sessionId, {
      status: "completed",
      message: `${message}${errors.length > 0 ? ` (${errors.length} errors)` : ""}`,
      endTime: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    updateProgress(sessionId, {
      status: "error",
      message: `Error: ${String(error)}`,
      endTime: new Date(),
    });
    throw error;
  }
}
