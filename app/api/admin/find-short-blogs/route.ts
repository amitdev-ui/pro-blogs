import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as cheerio from "cheerio";

/**
 * API to find posts that only contain headings or very short content
 * Returns posts that:
 * 1. Have less than 300 words (very short - clearly useless)
 * 2. Only contain headings with minimal text content
 * 3. Are essentially useless blogs
 * 
 * Note: Main scraper requires 550 words, but this tool finds posts under 300 words
 * for easy cleanup of clearly problematic content.
 */
export async function GET(request: NextRequest) {
  try {
    // Get all posts with content
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        description: true,
        sourceUrl: true,
        createdAt: true,
        website: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const problematicPosts = [];

    for (const post of allPosts) {
      if (!post.content || post.content.trim().length === 0) {
        problematicPosts.push({
          id: post.id,
          slug: post.slug,
          title: post.title,
          description: post.description,
          sourceUrl: post.sourceUrl,
          websiteName: post.website?.name || "Unknown",
          createdAt: post.createdAt,
          issue: "No content",
          wordCount: 0,
          headingCount: 0,
          textLength: 0,
        });
        continue;
      }

      try {
        // Parse HTML to analyze content structure
        const $ = cheerio.load(post.content);
        
        // Extract all headings
        const headings = $('h1, h2, h3, h4, h5, h6').toArray();
        const headingTexts = headings.map(h => $(h).text().trim()).filter(t => t.length > 0);
        
        // Get all text content (excluding headings for now)
        $('h1, h2, h3, h4, h5, h6').remove();
        const plainText = $.text().trim();
        const textLength = plainText.length;
        
        // Count words in plain text (excluding headings)
        const words = plainText.split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        
        // Calculate total content (including headings)
        const totalPlainText = post.content.replace(/<[^>]*>/g, " ").trim();
        const totalWords = totalPlainText.split(/\s+/).filter(word => word.length > 0).length;
        
        // Identify problematic posts - only posts with less than 300 words
        let issue = null;
        
        // Check 1: Very short content (less than 300 words - clearly useless)
        if (totalWords < 300) {
          issue = `Only ${totalWords} words (very short - less than 300 words)`;
        }
        
        // Check 2: Only headings with minimal text content (and total < 300 words)
        // If we have headings but very little actual text content
        if (headingTexts.length > 0 && textLength < 200 && wordCount < 100 && totalWords < 300) {
          issue = `Only ${headingTexts.length} heading(s) with ${wordCount} words of text (${totalWords} total)`;
        }
        
        // Check 3: More headings than actual content (and total < 300 words)
        if (headingTexts.length > 2 && wordCount < headingTexts.length * 50 && totalWords < 300) {
          issue = `${headingTexts.length} headings but only ${wordCount} words of content (${totalWords} total)`;
        }
        
        // Check 4: Content is mostly headings (70%+ of words are in headings) and total < 300
        const headingWordCount = headingTexts
          .join(" ")
          .split(/\s+/)
          .filter(word => word.length > 0).length;
        
        if (totalWords > 0 && totalWords < 300 && headingWordCount / totalWords > 0.7) {
          issue = `Content is ${Math.round((headingWordCount / totalWords) * 100)}% headings (${totalWords} total words)`;
        }
        
        if (issue) {
          problematicPosts.push({
            id: post.id,
            slug: post.slug,
            title: post.title,
            description: post.description,
            sourceUrl: post.sourceUrl,
            websiteName: post.website?.name || "Unknown",
            createdAt: post.createdAt,
            issue,
            wordCount: totalWords,
            headingCount: headingTexts.length,
            textLength: textLength,
          });
        }
      } catch (error) {
        // If HTML parsing fails, check if content is very short (less than 300 words)
        const plainText = post.content.replace(/<[^>]*>/g, " ").trim();
        const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
        
        if (wordCount < 300) {
          problematicPosts.push({
            id: post.id,
            slug: post.slug,
            title: post.title,
            description: post.description,
            sourceUrl: post.sourceUrl,
            websiteName: post.website?.name || "Unknown",
            createdAt: post.createdAt,
            issue: `Parse error - only ${wordCount} words (less than 300)`,
            wordCount,
            headingCount: 0,
            textLength: plainText.length,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: problematicPosts.length,
      posts: problematicPosts,
    });
  } catch (error) {
    console.error("Error finding short blogs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to find short blogs",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

