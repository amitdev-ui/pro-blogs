import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API to delete a single short/useless blog post
 * Safety: Only deletes one post at a time to prevent accidental bulk deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: "Post ID is required",
        },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    // Delete the post
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted post: ${post.title}`,
      deletedPost: {
        id: post.id,
        slug: post.slug,
        title: post.title,
      },
    });
  } catch (error) {
    console.error("Error deleting short blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete post",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

