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
    const { title, imageUrl, linkUrl, adCode, width, height, placement, isActive = true } = body;

    console.log("Received ad creation request:", { 
      title: title?.substring(0, 50), 
      placement, 
      adCodeLength: adCode?.length,
      hasAdCode: !!adCode 
    });

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!placement || !placement.trim()) {
      return NextResponse.json(
        { error: "Placement is required" },
        { status: 400 }
      );
    }

    if (!adCode || !adCode.trim()) {
      return NextResponse.json(
        { error: "Ad code is required" },
        { status: 400 }
      );
    }

    // Validate and prepare data
    const adData: any = {
      title: title.trim(),
      placement: placement.trim(),
      adCode: adCode.trim(),
      linkUrl: (linkUrl && linkUrl.trim() !== "") ? linkUrl.trim() : "#",
      imageUrl: null,
      isActive: Boolean(isActive),
    };

    // Add optional fields only if provided
    if (width !== undefined && width !== null && width !== "") {
      const parsedWidth = typeof width === 'string' ? parseInt(width) : width;
      if (!isNaN(parsedWidth) && parsedWidth > 0) {
        adData.width = parsedWidth;
      }
    }
    
    if (height !== undefined && height !== null && height !== "") {
      const parsedHeight = typeof height === 'string' ? parseInt(height) : height;
      if (!isNaN(parsedHeight) && parsedHeight > 0) {
        adData.height = parsedHeight;
      }
    }

    console.log("Creating ad with data:", { 
      ...adData, 
      adCode: adData.adCode.substring(0, 100) + "..." 
    });

    const ad = await prisma.ad.create({
      data: adData,
    });

    console.log("Ad created successfully:", ad.id);
    return NextResponse.json({ ad }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ad:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.substring(0, 500)
    });
    
    let errorMessage = "Failed to create ad";
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.code === 'P2002') {
      errorMessage = "An ad with this title already exists";
    } else if (error?.code === 'P2003') {
      errorMessage = "Invalid data provided";
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error?.code || "UNKNOWN_ERROR",
        message: error?.message 
      },
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