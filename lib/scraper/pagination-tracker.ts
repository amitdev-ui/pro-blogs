/**
 * Pagination Tracker
 * Tracks which page/offset each website is currently on
 * So scheduled scraping can continue from where it left off
 */

interface PaginationState {
  websiteId: string;
  currentOffset: number; // How many pages we've already scraped (0 = start from beginning)
  lastScrapedAt: Date;
}

// Store pagination state in memory (per website)
const paginationStates = new Map<string, PaginationState>();

// Pages per scheduled run
const PAGES_PER_RUN = 500;

/**
 * Get the current offset (starting page) for a website
 * Returns how many pages have already been scraped
 */
export function getCurrentOffset(websiteId: string): number {
  const state = paginationStates.get(websiteId);
  return state?.currentOffset || 0;
}

/**
 * Advance the offset after scraping (add 500 pages)
 */
export function advanceOffset(websiteId: string): void {
  const current = paginationStates.get(websiteId);
  const newOffset = (current?.currentOffset || 0) + PAGES_PER_RUN;
  
  paginationStates.set(websiteId, {
    websiteId,
    currentOffset: newOffset,
    lastScrapedAt: new Date(),
  });
  
  console.log(`[Pagination Tracker] Advanced offset for website ${websiteId}: ${current?.currentOffset || 0} → ${newOffset} pages`);
}

/**
 * Reset offset to start from beginning
 */
export function resetOffset(websiteId: string): void {
  paginationStates.set(websiteId, {
    websiteId,
    currentOffset: 0,
    lastScrapedAt: new Date(),
  });
  
  console.log(`[Pagination Tracker] Reset offset for website ${websiteId} to 0 (start from beginning)`);
}

/**
 * Get pagination state for a website
 */
export function getPaginationState(websiteId: string): PaginationState | null {
  return paginationStates.get(websiteId) || null;
}

/**
 * Get all pagination states (for debugging/admin)
 */
export function getAllPaginationStates(): Array<PaginationState> {
  return Array.from(paginationStates.values());
}

