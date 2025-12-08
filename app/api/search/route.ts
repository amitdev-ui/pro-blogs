import { NextRequest, NextResponse } from "next/server";
import { searchPosts } from "@/lib/post-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ posts: [] });
    }

    const posts = await searchPosts(query, 100);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error searching posts:", error);
    return NextResponse.json(
      { error: "Failed to search posts", posts: [] },
      { status: 500 }
    );
  }
}

