import { NextRequest, NextResponse } from "next/server";
import { cancelSession } from "@/lib/scraper/progress-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Cancel the scraping session
    cancelSession(sessionId);

    return NextResponse.json({
      success: true,
      message: "Scraping stopped",
      sessionId,
    });
  } catch (error) {
    console.error("Error stopping scraper:", error);
    return NextResponse.json(
      { error: "Failed to stop scraping", details: String(error) },
      { status: 500 }
    );
  }
}

