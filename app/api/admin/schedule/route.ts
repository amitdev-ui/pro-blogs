import { NextRequest, NextResponse } from "next/server";
import {
  startScheduledScraping,
  stopScheduledScraping,
  getActiveSchedules,
} from "@/lib/scraper/scheduler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, websiteId, schedule } = body;

    if (action === "test") {
      // Test run - execute immediately without scheduling
      if (!websiteId) {
        return NextResponse.json(
          { error: "Website ID is required" },
          { status: 400 }
        );
      }

      // Import required modules
      const { runScheduledScrape } = await import("@/lib/scraper/scheduler");
      const { prisma } = await import("@/lib/prisma");
      
      if (websiteId === "all") {
        const websites = await prisma.website.findMany({ orderBy: { name: "asc" } });
        
        // Run all websites sequentially in background
        (async () => {
          for (let i = 0; i < websites.length; i++) {
            const website = websites[i];
            const sessionId = `test-all-${website.id}-${Date.now()}`;
            
            try {
              let selectors;
              try {
                selectors = typeof website.selectors === "string" ? JSON.parse(website.selectors) : website.selectors;
              } catch {
                selectors = {};
              }

              const config = { name: website.name, url: website.url, selectors };
              await runScheduledScrape(sessionId, website.id, config);
              
              if (i < websites.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            } catch (error) {
              console.error(`Test run error for ${website.name}:`, error);
            }
          }
        })().catch(console.error);
        
        return NextResponse.json({
          success: true,
          message: `Test run started for all ${websites.length} websites. Check server logs and /admin/posts for results.`,
        });
      } else {
        const website = await prisma.website.findUnique({ where: { id: websiteId } });
        if (!website) {
          return NextResponse.json({ error: "Website not found" }, { status: 404 });
        }
        
        let selectors;
        try {
          selectors = typeof website.selectors === "string" ? JSON.parse(website.selectors) : website.selectors;
        } catch {
          selectors = {};
        }

        const config = { name: website.name, url: website.url, selectors };
        const sessionId = `test-${websiteId}-${Date.now()}`;
        
        // Run in background
        runScheduledScrape(sessionId, websiteId, config).catch(console.error);
        
        return NextResponse.json({
          success: true,
          message: `Test run started for ${website.name}. Check /admin/posts and server logs for results.`,
        });
      }
    } else if (action === "start") {
      if (!websiteId) {
        return NextResponse.json(
          { error: "Website ID is required" },
          { status: 400 }
        );
      }

      // Default schedule: every 6 hours
      const cronSchedule = schedule || "0 */6 * * *";
      const success = await startScheduledScraping(websiteId, cronSchedule);

      if (success) {
        return NextResponse.json({
          success: true,
          message: "Scheduled scraping started",
        });
      } else {
        return NextResponse.json(
          { error: "Failed to start scheduled scraping" },
          { status: 500 }
        );
      }
    } else if (action === "stop") {
      if (!websiteId) {
        return NextResponse.json(
          { error: "Website ID is required" },
          { status: 400 }
        );
      }

      const success = stopScheduledScraping(websiteId);

      if (success) {
        return NextResponse.json({
          success: true,
          message: "Scheduled scraping stopped",
        });
      } else {
        return NextResponse.json(
          { error: "No active schedule found" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start' or 'stop'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error managing schedule:", error);
    return NextResponse.json(
      { error: "Failed to manage schedule", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const schedules = getActiveSchedules();
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error getting schedules:", error);
    return NextResponse.json(
      { error: "Failed to get schedules", details: String(error) },
      { status: 500 }
    );
  }
}

