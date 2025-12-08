import { NextResponse } from "next/server";
import { initializeAutoScheduler } from "@/lib/scraper/auto-scheduler";

/**
 * Initialize auto-scheduler on server startup
 * This endpoint can be called when the server starts
 */
export async function GET() {
  try {
    await initializeAutoScheduler();
    return NextResponse.json({ 
      success: true, 
      message: "Auto-scheduler initialized. Scraping all websites every hour automatically." 
    });
  } catch (error) {
    console.error("Error initializing auto-scheduler:", error);
    return NextResponse.json(
      { error: "Failed to initialize auto-scheduler", details: String(error) },
      { status: 500 }
    );
  }
}

