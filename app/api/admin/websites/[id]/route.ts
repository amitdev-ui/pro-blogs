import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ website });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch website" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, url, selectors } = body;

    const website = await prisma.website.update({
      where: { id },
      data: {
        name,
        url,
        selectors: typeof selectors === "string" ? selectors : JSON.stringify(selectors),
      },
    });

    return NextResponse.json({ website });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update website" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.website.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete website" },
      { status: 500 }
    );
  }
}

