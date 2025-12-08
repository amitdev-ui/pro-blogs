// Store progress for each scraping session
const progressStore = new Map<string, {
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  websiteId?: string;
  websiteName?: string;
  currentPost?: number;
  totalPosts?: number;
  message?: string;
  postsScraped?: number;
  errors?: string[];
  startTime?: Date | string;
  endTime?: Date | string;
  cancelled?: boolean;
}>();

// Store cancellation flags
const cancellationFlags = new Map<string, boolean>();

// Helper function to update progress (called from scraper)
export function updateProgress(sessionId: string, data: Partial<{
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  websiteId?: string;
  websiteName?: string;
  currentPost?: number;
  totalPosts?: number;
  message?: string;
  postsScraped?: number;
  errors?: string[];
  startTime?: Date | string;
  endTime?: Date | string;
  cancelled?: boolean;
}>) {
  const current = progressStore.get(sessionId) || { status: 'idle' as const };
  progressStore.set(sessionId, { ...current, ...data });
}

// Helper function to get current progress
export function getProgress(sessionId: string) {
  return progressStore.get(sessionId) || { status: 'idle' as const, message: 'Ready to scrape' };
}

// Check if a session is cancelled
export function isCancelled(sessionId: string): boolean {
  return cancellationFlags.get(sessionId) === true;
}

// Cancel a scraping session
export function cancelSession(sessionId: string): void {
  cancellationFlags.set(sessionId, true);
  updateProgress(sessionId, {
    status: 'cancelled',
    message: 'Scraping cancelled by user',
    endTime: new Date(),
    cancelled: true,
  });
}

// Get the progress store (for SSE endpoint)
export function getProgressStore() {
  return progressStore;
}

