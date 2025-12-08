import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const allWebsites = await prisma.website.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            posts: true,
            logs: true,
          },
        },
      },
    });

    // Remove duplicates - keep the one with the most posts or the earliest created
    const uniqueWebsites = new Map<string, typeof allWebsites[0]>();
    
    for (const website of allWebsites) {
      const key = website.name.toLowerCase().trim();
      const existing = uniqueWebsites.get(key);
      
      if (!existing) {
        uniqueWebsites.set(key, website);
      } else {
        // Keep the one with more posts, or if equal, keep the earlier one
        const existingPosts = existing._count.posts;
        const currentPosts = website._count.posts;
        
        if (currentPosts > existingPosts || 
            (currentPosts === existingPosts && website.createdAt < existing.createdAt)) {
          uniqueWebsites.set(key, website);
        }
      }
    }

    const websites = Array.from(uniqueWebsites.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ websites });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch websites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, selectors } = body;

    if (!name || !url || !selectors) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const website = await prisma.website.create({
      data: {
        name,
        url,
        selectors: typeof selectors === "string" ? selectors : JSON.stringify(selectors),
      },
    });

    return NextResponse.json({ website }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create website" },
      { status: 500 }
    );
  }
}

