import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Default to 550 words minimum (matching scraper requirement - good for SEO)
    const { keepOriginal = true, minWords = 550, deleteAll = false } = body;

    // If deleteAll is true, remove ALL posts (no filters)
    if (deleteAll) {
      const totalPosts = await prisma.post.count();
      if (totalPosts === 0) {
        return NextResponse.json({
          success: true,
          message: "No posts to delete",
          deleted: 0,
        });
      }

      await prisma.post.deleteMany({});

      return NextResponse.json({
        success: true,
        message: `Deleted ALL ${totalPosts} posts`,
        deleted: totalPosts,
        totalPosts: 0,
        emptyPosts: 0,
      });
    }

    // Find all posts
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc", // Oldest first
      },
    });

    // Identify empty posts (no content or content < minWords)
    // Use word count to match scraper logic (550 words minimum - good for SEO)
    const emptyPosts = allPosts.filter((post) => {
      if (!post.content) return true;
      const plainText = post.content.replace(/<[^>]*>/g, "").trim();
      const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
      return wordCount < minWords;
    });

    // If keepOriginal is true, keep the first 82 posts (oldest)
    let postsToDelete = emptyPosts;
    if (keepOriginal) {
      // Keep first 82 posts regardless of content
      const postsToKeep = allPosts.slice(0, 82).map((p) => p.id);
      postsToDelete = emptyPosts.filter((p) => !postsToKeep.includes(p.id));
    }

    const deleteCount = postsToDelete.length;

    if (deleteCount === 0) {
      return NextResponse.json({
        success: true,
        message: "No empty posts to delete",
        deleted: 0,
      });
    }

    // Delete empty posts
    await prisma.post.deleteMany({
      where: {
        id: {
          in: postsToDelete.map((p) => p.id),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleteCount} empty posts`,
      deleted: deleteCount,
      totalPosts: allPosts.length,
      emptyPosts: emptyPosts.length,
    });
  } catch (error) {
    console.error("Error deleting empty posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete empty posts",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

