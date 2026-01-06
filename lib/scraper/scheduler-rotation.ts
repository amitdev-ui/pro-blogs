/**
 * Scheduler Rotation Manager
 * Tracks which website should be processed next in the rotation
 * Processes one website per scheduled run (500 pages each)
 */

interface RotationState {
  currentWebsiteIndex: number;
  lastWebsiteId: string | null;
  lastRotationTime: Date;
}

// Store rotation state in memory
let rotationState: RotationState | null = null;

/**
 * Get the next website in rotation for scheduled scraping
 * Returns website index and resets if all websites have been processed
 */
export function getNextWebsiteIndex(totalWebsites: number): number {
  if (!rotationState || rotationState.currentWebsiteIndex >= totalWebsites) {
    // Start from beginning or reset if exceeded
    rotationState = {
      currentWebsiteIndex: 0,
      lastWebsiteId: null,
      lastRotationTime: new Date(),
    };
    return 0;
  }
  
  return rotationState.currentWebsiteIndex;
}

/**
 * Move to next website in rotation
 */
export function advanceToNextWebsite(totalWebsites: number): void {
  if (!rotationState) {
    rotationState = {
      currentWebsiteIndex: 0,
      lastWebsiteId: null,
      lastRotationTime: new Date(),
    };
  }
  
  rotationState.currentWebsiteIndex = (rotationState.currentWebsiteIndex + 1) % totalWebsites;
  rotationState.lastRotationTime = new Date();
  
  console.log(`[Rotation] Advanced to website index ${rotationState.currentWebsiteIndex}/${totalWebsites}`);
}

/**
 * Reset rotation (start from beginning)
 */
export function resetRotation(): void {
  rotationState = {
    currentWebsiteIndex: 0,
    lastWebsiteId: null,
    lastRotationTime: new Date(),
  };
  console.log(`[Rotation] Rotation reset to start from beginning`);
}

/**
 * Get current rotation state
 */
export function getRotationState(): RotationState | null {
  return rotationState;
}

