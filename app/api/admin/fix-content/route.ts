import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rewriteForSEO, needsSEORewrite } from "@/lib/scraper/seo-rewriter";
import { fixPostImages, needsImageFix } from "@/lib/scraper/image-fixer";
import { updateProgress } from "@/lib/scraper/progress-store";
import { BlogScraper } from "@/lib/scraper";
import { cleanArticleContent } from "@/lib/scraper/content-cleaner";

export async function POST(request: NextRequest) {
  const sessionId = `fix-content-${Date.now()}`;
  
  try {
    const body = await request.json();
    const { type } = body; // "seo", "images", or "content"

    if (!type || !["seo", "images", "content"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'seo', 'images', or 'content'" },
        { status: 400 }
      );
    }

    // Return immediately and run fix in background
    runFixInBackground(sessionId, type).catch((error) => {
      console.error("Unhandled error in background fix:", error);
      updateProgress(sessionId, {
        status: 'error',
        message: `Unhandled error: ${String(error)}`,
        endTime: new Date(),
      });
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'seo' ? 'SEO rewrite' : type === 'images' ? 'Image fix' : 'Content fix'} started`,
      sessionId,
    });
  } catch (error) {
    console.error("Error starting fix:", error);
    return NextResponse.json(
      { error: "Failed to start fix", details: String(error) },
      { status: 500 }
    );
  }
}

async function runFixInBackground(sessionId: string, type: "seo" | "images" | "content") {
  try {
    const typeMessages: Record<string, string> = {
      seo: 'SEO rewrite',
      images: 'Image fix',
      content: 'Content fix'
    };

    updateProgress(sessionId, {
      status: 'running',
      message: `Starting ${typeMessages[type] || 'fix'}...`,
      startTime: new Date(),
      postsScraped: 0,
      errors: []
    });

    // Get all posts
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        thumbnail: true,
        coverImage: true,
        sourceUrl: true,
        websiteId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    updateProgress(sessionId, {
      message: `Found ${allPosts.length} posts. Analyzing...`,
      totalPosts: allPosts.length,
    });

    let fixedCount = 0;
    const errors: string[] = [];

    if (type === "seo") {
      // Find posts that need SEO rewriting
      const postsNeedingSEO = allPosts.filter(post => 
        needsSEORewrite(post.content)
      );

      updateProgress(sessionId, {
        message: `Found ${postsNeedingSEO.length} posts needing SEO optimization. Processing...`,
        totalPosts: postsNeedingSEO.length,
      });

      for (let i = 0; i < postsNeedingSEO.length; i++) {
        const post = postsNeedingSEO[i];
        try {
          updateProgress(sessionId, {
            currentPost: i + 1,
            message: `Rewriting SEO for: ${post.title.substring(0, 50)}...`,
          });

          if (post.content) {
            const rewrittenContent = rewriteForSEO(post.content);
            
            await prisma.post.update({
              where: { id: post.id },
              data: {
                content: rewrittenContent,
                updatedAt: new Date(),
              },
            });

            fixedCount++;
            updateProgress(sessionId, {
              postsScraped: fixedCount,
            });
          }
        } catch (error) {
          const errorMsg = `Error rewriting SEO for ${post.slug}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } else if (type === "images") {
      // Find posts that need image fixing
      const postsNeedingImages = allPosts.filter(post => 
        needsImageFix(post.thumbnail, post.coverImage)
      );

      updateProgress(sessionId, {
        message: `Found ${postsNeedingImages.length} posts needing images. Processing...`,
        totalPosts: postsNeedingImages.length,
      });

      for (let i = 0; i < postsNeedingImages.length; i++) {
        const post = postsNeedingImages[i];
        try {
          updateProgress(sessionId, {
            currentPost: i + 1,
            message: `Fixing images for: ${post.title.substring(0, 50)}...`,
          });

          const imageResult = await fixPostImages(post.sourceUrl);
          
          if (imageResult.success) {
            await prisma.post.update({
              where: { id: post.id },
              data: {
                thumbnail: imageResult.thumbnail || post.thumbnail,
                coverImage: imageResult.coverImage || post.coverImage,
                updatedAt: new Date(),
              },
            });

            fixedCount++;
            updateProgress(sessionId, {
              postsScraped: fixedCount,
            });
          } else {
            errors.push(`No images found for ${post.slug}: ${imageResult.message}`);
          }
        } catch (error) {
          const errorMsg = `Error fixing images for ${post.slug}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } else if (type === "content") {
      // Find posts with missing content (or very short content)
      // Primary rule: Articles must be at least 550 words (good for SEO)
      const postsNeedingContent = allPosts.filter(post => {
        if (!post.content) return true;
        const plainText = post.content.replace(/<[^>]*>/g, "").trim();
        const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
        return wordCount < 550;
      });

      updateProgress(sessionId, {
        message: `Found ${postsNeedingContent.length} posts needing content. Processing...`,
        totalPosts: postsNeedingContent.length,
      });

      for (let i = 0; i < postsNeedingContent.length; i++) {
        const post = postsNeedingContent[i];
        try {
          updateProgress(sessionId, {
            currentPost: i + 1,
            message: `Scraping content for: ${post.title.substring(0, 50)}...`,
          });

          if (post.sourceUrl && post.websiteId) {
            // Get website config for scraper
            const website = await prisma.website.findUnique({
              where: { id: post.websiteId },
            });

            if (website) {
              let selectors;
              try {
                selectors = typeof website.selectors === "string"
                  ? JSON.parse(website.selectors)
                  : website.selectors;
              } catch {
                selectors = {};
              }

              const config = {
                name: website.name,
                url: website.url,
                selectors,
              };

              const scraper = new BlogScraper(config);
              const scrapeResult = await scraper.scrapeFullPost(post.sourceUrl);
              
              // Check if content has at least 550 words (good for SEO)
              const plainText = scrapeResult.content.replace(/<[^>]*>/g, "").trim();
              const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
              if (scrapeResult.content && wordCount >= 550) {
                // Clean and optimize content
                // Detect if it's TechCrunch for better cleaning
                const isTechCrunch = post.sourceUrl?.includes("techcrunch.com") || false;
                let cleanedContent = cleanArticleContent(scrapeResult.content, isTechCrunch);
                cleanedContent = rewriteForSEO(cleanedContent);
                
                await prisma.post.update({
                  where: { id: post.id },
                  data: {
                    content: cleanedContent,
                    updatedAt: new Date(),
                  },
                });

                fixedCount++;
                updateProgress(sessionId, {
                  postsScraped: fixedCount,
                });
              } else {
                errors.push(`No content found for ${post.slug}`);
              }
            }
          } else {
            errors.push(`No source URL for ${post.slug}`);
          }
        } catch (error) {
          const errorMsg = `Error fixing content for ${post.slug}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }

    updateProgress(sessionId, {
      status: 'completed',
      message: `Completed! Fixed ${fixedCount} posts${errors.length > 0 ? ` (${errors.length} errors)` : ''}.`,
      postsScraped: fixedCount,
      endTime: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    });

    console.log(`Fix completed for session ${sessionId}: ${fixedCount} posts fixed`);
  } catch (error) {
    console.error("Fix error:", error);
    
    updateProgress(sessionId, {
      status: 'error',
      message: `Error: ${String(error)}`,
      endTime: new Date(),
    });
  }
}

