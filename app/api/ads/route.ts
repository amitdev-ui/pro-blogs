import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint to fetch active ads for a placement
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get("placement") || "sidebar";
    const limit = parseInt(searchParams.get("limit") || "3", 10);

    const ads = await prisma.ad.findMany({
      where: {
        placement,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ ads });
  } catch (error) {
    console.error("Error fetching public ads:", error);
    return NextResponse.json(
      { error: "Failed to fetch ads" },
      { status: 500 }
    );
  }
}

