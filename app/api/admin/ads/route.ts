import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/ads - list ads (optionally by placement)
export async function GET(request: NextRequest) {
  try {
    const placement = request.nextUrl.searchParams.get("placement") || undefined;

    const ads = await prisma.ad.findMany({
      where: placement ? { placement } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ads });
  } catch (error) {
    console.error("Error fetching ads:", error);
    return NextResponse.json(
      { error: "Failed to fetch ads" },
      { status: 500 }
    );
  }
}

// POST /api/admin/ads - create a new ad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, imageUrl, linkUrl, placement, isActive = true } = body;

    if (!title || !linkUrl || !placement) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ad = await prisma.ad.create({
      data: {
        title,
        imageUrl: imageUrl || null,
        linkUrl,
        placement,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ ad }, { status: 201 });
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json(
      { error: "Failed to create ad" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/ads - update an ad (toggle active or edit fields)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Ad ID is required" },
        { status: 400 }
      );
    }

    const ad = await prisma.ad.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ad });
  } catch (error) {
    console.error("Error updating ad:", error);
    return NextResponse.json(
      { error: "Failed to update ad" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/ads - delete an ad
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Ad ID is required" },
        { status: 400 }
      );
    }

    await prisma.ad.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ad:", error);
    return NextResponse.json(
      { error: "Failed to delete ad" },
      { status: 500 }
    );
  }
}