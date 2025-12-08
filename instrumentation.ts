/**
 * Next.js instrumentation file
 * This runs automatically when the server starts
 * No manual setup needed - scraper will run every hour automatically
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize auto-scheduler when server starts
    // This will automatically start scraping all websites every hour
    const { initializeAutoScheduler } = await import('./lib/scraper/auto-scheduler');
    
    // Small delay to ensure database and everything is ready
    setTimeout(() => {
      initializeAutoScheduler().catch((error) => {
        console.error('[Auto-Scheduler] Failed to initialize:', error);
      });
    }, 5000); // 5 second delay after server starts
  }
}

