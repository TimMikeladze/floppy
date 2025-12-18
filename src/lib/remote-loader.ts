/**
 * Remote image loader with privacy protections.
 * Fetches images anonymously without leaking referrer or credentials.
 */

// Track active object URLs for cleanup
const activeUrls = new Map<string, string>();

/**
 * Load a remote image anonymously and return a blob URL.
 * The blob URL can be used directly in <img src>.
 */
export async function loadRemoteImage(imageUrl: string): Promise<string> {
  // Check if we already have this URL loaded
  const existing = activeUrls.get(imageUrl);
  if (existing) {
    return existing;
  }

  const response = await fetch(imageUrl, {
    referrerPolicy: "no-referrer",
    credentials: "omit",
    mode: "cors",
  });

  if (!response.ok) {
    throw new Error(`Failed to load image: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  activeUrls.set(imageUrl, objectUrl);
  return objectUrl;
}

/**
 * Revoke a specific object URL to free memory.
 */
export function revokeRemoteImage(imageUrl: string): void {
  const objectUrl = activeUrls.get(imageUrl);
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    activeUrls.delete(imageUrl);
  }
}

/**
 * Revoke all active object URLs.
 * Call this when unmounting or navigating away.
 */
export function revokeAllRemoteImages(): void {
  for (const objectUrl of activeUrls.values()) {
    URL.revokeObjectURL(objectUrl);
  }
  activeUrls.clear();
}

/**
 * Get the count of active object URLs (for debugging).
 */
export function getActiveUrlCount(): number {
  return activeUrls.size;
}

/**
 * Load a remote image as a Blob (for caching to IndexedDB).
 * Does not create an object URL - returns the raw blob.
 */
export async function loadRemoteImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl, {
    referrerPolicy: "no-referrer",
    credentials: "omit",
    mode: "cors",
  });

  if (!response.ok) {
    throw new Error(`Failed to load image: ${response.status}`);
  }

  return await response.blob();
}
