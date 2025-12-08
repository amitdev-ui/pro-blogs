/**
 * Auto-scheduler: Automatically starts scraping all websites every hour
 * This runs automatically when the server starts - no manual setup needed
 */

import { startScheduledScraping } from "./scheduler";

let isInitialized = false;

/**
 * Initialize automatic scraping for all websites
 * Runs every hour automatically
 */
export async function initializeAutoScheduler() {
  if (isInitialized) {
    return;
  }

  try {
    console.log("[Auto-Scheduler] Initializing automatic scraping (every hour)...");
    
    // Start scheduled scraping for all websites every hour
    // Cron: "0 * * * *" means "at minute 0 of every hour"
    const success = await startScheduledScraping("all", "0 * * * *");
    
    if (success) {
      console.log("[Auto-Scheduler] ✓ Automatic scraping started successfully!");
      console.log("[Auto-Scheduler] All websites will be scraped every hour automatically.");
      isInitialized = true;
    } else {
      console.error("[Auto-Scheduler] ✗ Failed to start automatic scraping");
    }
  } catch (error) {
    console.error("[Auto-Scheduler] Error initializing:", error);
  }
}

/**
 * Check if auto-scheduler is initialized
 */
export function isAutoSchedulerInitialized(): boolean {
  return isInitialized;
}

