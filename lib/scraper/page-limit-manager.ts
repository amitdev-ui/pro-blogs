/**
 * Dynamic Page Limit Manager
 * Automatically increases page limits when all posts are duplicates
 */

interface PageLimit {
  websiteId: string;
  mainScraperLimit: number;
  categoryScraperLimit: number;
  lastUpdated: Date;
}

// Store page limits in memory (per website)
const pageLimits = new Map<string, PageLimit>();

// Base limits (starting points)
// Scheduled runs process exactly 500 pages per website per run
const BASE_MAIN_LIMIT = 500;
const BASE_CATEGORY_LIMIT = 5000;

// Scheduled scraping limit: exactly 500 pages per website per run
export const SCHEDULED_PAGES_PER_RUN = 500;

// Maximum limits (safety caps)
const MAX_MAIN_LIMIT = 10000;
const MAX_CATEGORY_LIMIT = 50000;

// Increase multiplier when all duplicates found
const LIMIT_INCREASE_MULTIPLIER = 1.5; // Increase by 50% each time

/**
 * Get current page limit for a website
 */
export function getPageLimit(websiteId: string, type: 'main' | 'category'): number {
  const limit = pageLimits.get(websiteId);
  
  if (!limit) {
    // Initialize with base limit
    const newLimit: PageLimit = {
      websiteId,
      mainScraperLimit: BASE_MAIN_LIMIT,
      categoryScraperLimit: BASE_CATEGORY_LIMIT,
      lastUpdated: new Date(),
    };
    pageLimits.set(websiteId, newLimit);
    return type === 'main' ? BASE_MAIN_LIMIT : BASE_CATEGORY_LIMIT;
  }
  
  return type === 'main' ? limit.mainScraperLimit : limit.categoryScraperLimit;
}

/**
 * Increase page limit when all posts are duplicates
 * Returns the new limit
 */
export function increasePageLimit(websiteId: string, type: 'main' | 'category'): number {
  const current = pageLimits.get(websiteId);
  
  if (!current) {
    // Initialize first
    const newLimit: PageLimit = {
      websiteId,
      mainScraperLimit: BASE_MAIN_LIMIT,
      categoryScraperLimit: BASE_CATEGORY_LIMIT,
      lastUpdated: new Date(),
    };
    pageLimits.set(websiteId, newLimit);
    return type === 'main' ? BASE_MAIN_LIMIT : BASE_CATEGORY_LIMIT;
  }
  
  const currentLimit = type === 'main' ? current.mainScraperLimit : current.categoryScraperLimit;
  const maxLimit = type === 'main' ? MAX_MAIN_LIMIT : MAX_CATEGORY_LIMIT;
  
  // Calculate new limit (increase by multiplier, but cap at max)
  const newLimit = Math.min(
    Math.ceil(currentLimit * LIMIT_INCREASE_MULTIPLIER),
    maxLimit
  );
  
  // Update the limit
  if (type === 'main') {
    current.mainScraperLimit = newLimit;
  } else {
    current.categoryScraperLimit = newLimit;
  }
  current.lastUpdated = new Date();
  
  console.log(`[Page Limit] Increased ${type} scraper limit for website ${websiteId}: ${currentLimit} → ${newLimit}`);
  
  return newLimit;
}

/**
 * Reset page limit to base (if needed)
 */
export function resetPageLimit(websiteId: string, type: 'main' | 'category'): void {
  const current = pageLimits.get(websiteId);
  
  if (!current) {
    return;
  }
  
  const baseLimit = type === 'main' ? BASE_MAIN_LIMIT : BASE_CATEGORY_LIMIT;
  
  if (type === 'main') {
    current.mainScraperLimit = baseLimit;
  } else {
    current.categoryScraperLimit = baseLimit;
  }
  current.lastUpdated = new Date();
  
  console.log(`[Page Limit] Reset ${type} scraper limit for website ${websiteId} to ${baseLimit}`);
}

/**
 * Get all page limits (for debugging/admin)
 */
export function getAllPageLimits(): Array<PageLimit> {
  return Array.from(pageLimits.values());
}

