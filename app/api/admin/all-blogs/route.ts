import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as cheerio from "cheerio";

/**
 * API to get all blogs with search functionality
 * Supports fuzzy search (typo-tolerant, case-insensitive)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search")?.trim() || "";

    // Get all posts
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true,
        author: true,
        date: true,
        createdAt: true,
        updatedAt: true,
        sourceUrl: true,
        category: true,
        tags: true,
        readingTime: true,
        thumbnail: true,
        coverImage: true,
        website: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process posts to calculate stats
    const processedPosts = allPosts.map((post) => {
      let wordCount = 0;
      let charCount = 0;
      let headingCount = 0;
      let seoScore = 0;

      if (post.content) {
        try {
          const $ = cheerio.load(post.content);
          
          // Count headings
          headingCount = $("h1, h2, h3, h4, h5, h6").length;
          
          // Get plain text
          const plainText = post.content.replace(/<[^>]*>/g, " ").trim();
          charCount = plainText.length;
          
          // Count words
          const words = plainText.split(/\s+/).filter((word) => word.length > 0);
          wordCount = words.length;
          
          // Calculate basic SEO score (0-100)
          let score = 0;
          
          // Word count score (40 points max)
          if (wordCount >= 550) score += 40;
          else if (wordCount >= 400) score += 30;
          else if (wordCount >= 300) score += 20;
          else if (wordCount >= 200) score += 10;
          
          // Heading structure (20 points max)
          if (headingCount >= 3) score += 20;
          else if (headingCount >= 2) score += 15;
          else if (headingCount >= 1) score += 10;
          
          // Meta information (20 points max)
          if (post.title && post.title.length > 10) score += 5;
          if (post.description && post.description.length > 50) score += 5;
          if (post.category) score += 5;
          if (post.tags && (typeof post.tags === 'string' ? JSON.parse(post.tags || '[]') : post.tags).length > 0) score += 5;
          
          // Images (20 points max)
          if (post.coverImage) score += 10;
          if (post.thumbnail) score += 10;
          
          seoScore = Math.min(100, score);
        } catch (error) {
          // If parsing fails, use simple text extraction
          const plainText = post.content.replace(/<[^>]*>/g, " ").trim();
          charCount = plainText.length;
          wordCount = plainText.split(/\s+/).filter((word) => word.length > 0).length;
        }
      }

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        description: post.description,
        author: post.author,
        date: post.date,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        sourceUrl: post.sourceUrl,
        category: post.category,
        tags: typeof post.tags === 'string' ? JSON.parse(post.tags || '[]') : (post.tags || []),
        readingTime: post.readingTime,
        thumbnail: post.thumbnail,
        coverImage: post.coverImage,
        websiteName: post.website?.name || "Unknown",
        websiteUrl: post.website?.url || "",
        wordCount,
        charCount,
        headingCount,
        seoScore,
      };
    });

    // Apply search filter if query provided
    let filteredPosts = processedPosts;
    
    if (searchQuery) {
      // Normalize search query (remove common typos, case insensitive)
      const normalizedQuery = normalizeSearchQuery(searchQuery.toLowerCase());
      const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
      
      filteredPosts = processedPosts.filter((post) => {
        // Search in multiple fields
        const searchFields = [
          post.title?.toLowerCase() || "",
          post.description?.toLowerCase() || "",
          post.author?.toLowerCase() || "",
          post.category?.toLowerCase() || "",
          post.websiteName?.toLowerCase() || "",
          (post.tags || []).join(" ").toLowerCase(),
        ].join(" ");
        
        // Normalize search fields
        const normalizedFields = normalizeSearchQuery(searchFields);
        
        // Check if any query word matches (fuzzy)
        let matches = false;
        
        for (const queryWord of queryWords) {
          // Exact match
          if (normalizedFields.includes(queryWord)) {
            matches = true;
            break;
          }
          
          // Fuzzy match - check if any word in fields is similar
          const fieldWords = normalizedFields.split(/\s+/);
          for (const fieldWord of fieldWords) {
            if (fieldWord.length > 2 && queryWord.length > 2) {
              const similarity = calculateSimilarity(queryWord, fieldWord);
              // 70% similarity threshold for fuzzy matching
              if (similarity >= 0.7 || fieldWord.includes(queryWord) || queryWord.includes(fieldWord)) {
                matches = true;
                break;
              }
            }
          }
          
          if (matches) break;
        }
        
        return matches;
      });
    }

    return NextResponse.json({
      success: true,
      count: filteredPosts.length,
      total: processedPosts.length,
      posts: filteredPosts,
    });
  } catch (error) {
    console.error("Error fetching all blogs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch blogs",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Normalize search query to handle common typos and variations
 * Supports fuzzy matching for better search experience
 */
function normalizeSearchQuery(query: string): string {
  let normalized = query.toLowerCase().trim();
  
  // Common typo corrections
  const typoMap: Record<string, string> = {
    "becoz": "because",
    "becouse": "because",
    "becuase": "because",
    "becasue": "because",
    "seo": "seo",
    "marketing": "marketing",
    "markerting": "marketing",
    "markeing": "marketing",
    "advertising": "advertising",
    "advertizing": "advertising",
    "adversting": "advertising",
    "tutorial": "tutorial",
    "tuturial": "tutorial",
    "tutrial": "tutorial",
    "guide": "guide",
    "gude": "guide",
    "guied": "guide",
    "article": "article",
    "artical": "article",
    "artcle": "article",
    "blog": "blog",
    "blg": "blog",
    "design": "design",
    "desing": "design",
    "desgin": "design",
    "development": "development",
    "devlopment": "development",
    "devlopmnt": "development",
    "programming": "programming",
    "programing": "programming",
    "programmng": "programming",
    "technology": "technology",
    "tech": "tech",
    "technolgy": "technology",
    "website": "website",
    "websit": "website",
    "websie": "website",
    "content": "content",
    "contnet": "content",
    "conetnt": "content",
    "strategy": "strategy",
    "stratagy": "strategy",
    "strateg": "strategy",
  };
  
  // Replace common typos
  Object.entries(typoMap).forEach(([typo, correct]) => {
    const regex = new RegExp(`\\b${typo}\\b`, "gi");
    normalized = normalized.replace(regex, correct);
  });
  
  return normalized;
}

/**
 * Calculate similarity between two strings (simple fuzzy match)
 * Returns a score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Check if one contains the other
  if (longer.includes(shorter)) return 0.9;
  
  // Calculate Levenshtein-like similarity
  let matches = 0;
  const minLength = Math.min(longer.length, shorter.length);
  
  for (let i = 0; i < minLength; i++) {
    if (longer[i] === shorter[i]) matches++;
  }
  
  return matches / longer.length;
}

