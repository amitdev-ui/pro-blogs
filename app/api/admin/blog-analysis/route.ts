import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all posts with their content
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true,
        author: true,
        authorImage: true,
        date: true,
        readingTime: true,
        category: true,
        tags: true,
        thumbnail: true,
        coverImage: true,
        sourceUrl: true,
        websiteId: true,
        website: {
          select: {
            name: true,
          },
        },
      },
    });

    // Analyze posts
    const totalPosts = allPosts.length;
    let perfectPosts = 0;
    let emptyContentPosts = 0;
    let missingThumbnailPosts = 0;
    let missingCoverImagePosts = 0;
    let missingAuthorImagePosts = 0;
    let shortContentPosts = 0;
    let missingCategoryPosts = 0;
    let missingTagsPosts = 0;

    const emptyPosts: Array<{
      id: string;
      slug: string;
      title: string;
      website: string;
      issues: string[];
    }> = [];

    for (const post of allPosts) {
      const issues: string[] = [];
      let isPerfect = true;

      // Check content - use word count to match scraper logic (550 words minimum - good for SEO)
      const plainText = (post.content || "").replace(/<[^>]*>/g, "").trim();
      const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
      const plainTextLength = plainText.length;
      
      if (!post.content || plainTextLength === 0) {
        issues.push("Empty Content");
        emptyContentPosts++;
        isPerfect = false;
      } else if (wordCount < 550) {
        issues.push(`Short Content (${wordCount} words, need 550+)`);
        shortContentPosts++;
        isPerfect = false;
      }

      // Check thumbnail
      if (!post.thumbnail) {
        issues.push("Missing Thumbnail");
        missingThumbnailPosts++;
        isPerfect = false;
      }

      // Check cover image
      if (!post.coverImage) {
        issues.push("Missing Cover Image");
        missingCoverImagePosts++;
        isPerfect = false;
      }

      // Check author image
      if (!post.authorImage) {
        issues.push("Missing Author Image");
        missingAuthorImagePosts++;
        isPerfect = false;
      }

      // Check category
      if (!post.category || post.category.trim() === "") {
        issues.push("Missing Category");
        missingCategoryPosts++;
        isPerfect = false;
      }

      // Check tags
      let tagsArray: string[] = [];
      try {
        tagsArray = typeof post.tags === "string" ? JSON.parse(post.tags || "[]") : post.tags || [];
      } catch {
        tagsArray = [];
      }
      if (!tagsArray || tagsArray.length === 0) {
        issues.push("Missing Tags");
        missingTagsPosts++;
        isPerfect = false;
      }

      if (isPerfect) {
        perfectPosts++;
      } else {
        emptyPosts.push({
          id: post.id,
          slug: post.slug,
          title: post.title,
          website: post.website.name,
          issues,
        });
      }
    }

    // Group by website
    const postsByWebsite = await prisma.post.groupBy({
      by: ["websiteId"],
      _count: {
        id: true,
      },
    });

    const websiteStats = await Promise.all(
      postsByWebsite.map(async (stat) => {
        const website = await prisma.website.findUnique({
          where: { id: stat.websiteId },
          select: { name: true },
        });

        const websitePosts = allPosts.filter((p) => p.websiteId === stat.websiteId);
        const perfect = websitePosts.filter((p) => {
          // Use plain text length (strip HTML tags) to match scraper logic
          const plainTextLength = (p.content || "").replace(/<[^>]*>/g, "").trim().length;
          
          // Safely parse tags
          let tagsArray: string[] = [];
          try {
            tagsArray = typeof p.tags === "string" ? JSON.parse(p.tags || "[]") : p.tags || [];
          } catch {
            tagsArray = [];
          }
          
          return (
            (() => {
              const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
              return wordCount >= 550;
            })() &&
            p.thumbnail &&
            p.coverImage &&
            p.authorImage &&
            p.category &&
            tagsArray.length > 0
          );
        }).length;

        return {
          websiteName: website?.name || "Unknown",
          total: stat._count.id,
          perfect,
          issues: stat._count.id - perfect,
        };
      })
    );

    return NextResponse.json({
      success: true,
      statistics: {
        totalPosts,
        perfectPosts,
        emptyContentPosts,
        missingThumbnailPosts,
        missingCoverImagePosts,
        missingAuthorImagePosts,
        shortContentPosts,
        missingCategoryPosts,
        missingTagsPosts,
        postsWithIssues: emptyPosts.length,
      },
      emptyPosts: emptyPosts.slice(0, 100), // Limit to first 100 for performance
      websiteStats,
    });
  } catch (error) {
    console.error("Error analyzing blogs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze blogs",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

