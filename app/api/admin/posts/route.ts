import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        website: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        date: true,
        website: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts", posts: [] },
      { status: 500 }
    );
  }
}

