/**
 * Floppy service worker.
 *
 * Hard rule this file exists to enforce:
 *
 *   A document navigation is only ever answered with an HTML response.
 *
 * Floppy is a Next.js App Router app. Alongside HTML documents the router
 * fetches React Server Component "flight" payloads (`text/x-component`) for the
 * same pathnames — `/library`, `/reader/<id>`, and so on. Those payloads look
 * like ordinary same-origin GETs, so a pathname-based caching strategy happily
 * stores them and can later hand one back for a top-level navigation. When that
 * happens the browser paints the raw flight text as a plain-text document, React
 * never boots, and every in-app recovery affordance (including the error
 * boundary's "Clear Cache & Reload") becomes unreachable. On iOS, with no
 * devtools, that bricks the app permanently.
 *
 * The defenses, in order:
 *   1. RSC requests are never intercepted and never cached.
 *   2. Navigations are network-first, so a fresh deploy always wins.
 *   3. Every cache hit served to a navigation must pass an HTML content-type
 *      check; anything else is deleted from the cache and treated as a miss.
 *   4. A precached, dependency-free offline shell is the last resort.
 *   5. `?sw-reset=1` and `/reset.html` provide an escape hatch that works even
 *      when the app bundle cannot run.
 */

// Bump on every change to caching behavior — `activate` purges all other
// `floppy-` caches, which is what evicts previously poisoned entries.
const CACHE_VERSION = "v4";
const CACHE_NAME = `floppy-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline.html";
const RESET_URL = "/reset.html";

// Navigable app routes that are worth keeping a document shell for.
const PRECACHED_DOCUMENTS = [
  "/",
  "/library",
  "/collections",
  "/about",
  "/settings",
  "/releases",
  OFFLINE_URL,
  RESET_URL,
];

// Non-document assets to pre-cache. These are content-addressed or versioned by
// deploy, so cache-first is safe.
const PRECACHED_ASSETS = [
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-192x192.png",
  "/icon-maskable-512x512.png",
  "/apple-icon-180x180.png",
  // Must match the filenames produced by the `postinstall` copy step in
  // package.json. A wrong path here silently breaks CBR reading offline.
  "/libarchive-worker.js",
  "/libarchive.wasm",
];

/* -------------------------------------------------------------------------- */
/* Request / response classification                                          */
/* -------------------------------------------------------------------------- */

/**
 * True for React Server Component payload requests.
 *
 * These share a pathname with the HTML document they belong to, so they must be
 * identified by header/query — never by path. We check every signal Next.js
 * emits rather than the narrowest one, because caching a flight payload even
 * once is enough to brick the app.
 */
function isRscRequest(request) {
  const url = new URL(request.url);
  if (url.searchParams.has("_rsc")) {
    return true;
  }

  const headers = request.headers;
  if (headers.get("RSC") === "1") {
    return true;
  }
  if (headers.get("Next-Router-Prefetch") === "1") {
    return true;
  }
  if (headers.get("Next-Router-State-Tree")) {
    return true;
  }
  if (headers.get("Next-Router-Segment-Prefetch")) {
    return true;
  }

  const accept = headers.get("Accept") || "";
  return accept.includes("text/x-component");
}

/** True for top-level document navigations. */
function isNavigationRequest(request) {
  return request.mode === "navigate";
}

/**
 * True only for responses that a browser will render as a document.
 *
 * Opaque responses are rejected because their headers are unreadable, so we
 * cannot prove they are HTML.
 */
function isHtmlResponse(response) {
  if (!response) {
    return false;
  }
  if (response.type === "opaque" || response.type === "opaqueredirect") {
    return false;
  }
  const contentType = response.headers.get("Content-Type") || "";
  return contentType.toLowerCase().includes("text/html");
}

/** Requests carrying a reset instruction must always bypass the cache. */
function isResetRequest(url) {
  return url.searchParams.has("sw-reset") || url.pathname === RESET_URL;
}

/**
 * Whether a response may be written to the cache at all.
 *
 * `Vary: *` can never be matched again, and redirected responses throw when
 * replayed for a navigation, so neither is worth storing.
 */
function isCacheable(response) {
  if (!response || !response.ok || response.redirected) {
    return false;
  }
  if (response.type === "opaque" || response.type === "opaqueredirect") {
    return false;
  }
  return (response.headers.get("Vary") || "") !== "*";
}

/* -------------------------------------------------------------------------- */
/* Cache helpers                                                              */
/* -------------------------------------------------------------------------- */

async function putInCache(cache, request, response) {
  if (!isCacheable(response)) {
    return;
  }
  try {
    await cache.put(request, response.clone());
  } catch (error) {
    // A failed write is never worth failing the request over.
    console.warn("[sw] Failed to cache", request.url, error);
  }
}

/**
 * Read a cache entry that is safe to serve as a document.
 *
 * A non-HTML hit means the cache was poisoned — most likely by an older service
 * worker version that stored a flight payload. Delete it so the app heals
 * itself on the very next load instead of staying stuck.
 */
async function matchDocument(cache, request) {
  const cached = await cache.match(request);
  if (!cached) {
    return null;
  }
  if (isHtmlResponse(cached)) {
    return cached;
  }

  console.warn("[sw] Evicting non-HTML cache entry for navigation:", request.url);
  try {
    await cache.delete(request);
  } catch (error) {
    console.warn("[sw] Failed to evict poisoned entry", request.url, error);
  }
  return null;
}

/**
 * Last-resort document for an offline navigation.
 *
 * Order: the offline shell, then the app root. Both go through `matchDocument`,
 * so a poisoned entry can never escape through the fallback path either.
 */
async function offlineDocument(cache) {
  const offlineShell = await matchDocument(cache, new Request(OFFLINE_URL));
  if (offlineShell) {
    return offlineShell;
  }

  const root = await matchDocument(cache, new Request("/"));
  if (root) {
    return root;
  }

  return new Response(
    "<!doctype html><meta charset=utf-8><title>Offline</title>" +
      "<body style=\"font-family:system-ui;background:#0d0d0d;color:#fafafa;" +
      'padding:2rem;text-align:center">' +
      "<h1>You're offline</h1>" +
      "<p>Floppy couldn't load this page. Reconnect and try again.</p>" +
      `<p><a href="${RESET_URL}" style="color:#e85d4d">Reset the app</a></p>`,
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

/**
 * Wipe every Floppy cache. Used by the activate purge and the reset escape
 * hatch. Never touches IndexedDB — that holds the user's library.
 */
async function clearAllCaches() {
  const names = await caches.keys();
  await Promise.all(
    names.filter((name) => name.startsWith("floppy-")).map((name) => caches.delete(name)),
  );
}

/* -------------------------------------------------------------------------- */
/* Strategies                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Navigations: network-first, HTML-only.
 *
 * Network-first rather than stale-while-revalidate because a Next.js document
 * references build-hashed `/_next/static/` chunks. Serving a stale document
 * after a deploy points the browser at chunks that no longer exist — a second
 * way to brick the app.
 */
async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (isHtmlResponse(networkResponse)) {
      await putInCache(cache, request, networkResponse);
    }
    // Whatever the network says is the server's own answer — pass it through
    // untouched, including redirects and error pages.
    return networkResponse;
  } catch {
    // Offline from here down.
    const exact = await matchDocument(cache, request);
    if (exact) {
      return exact;
    }

    // Reader routes are per-comic URLs, so an exact document is often missing.
    // Any cached reader document works as a shell: the reader page reads the
    // comic id from `window.location` and loads it from IndexedDB.
    const url = new URL(request.url);
    if (url.pathname.startsWith("/reader/")) {
      const shell = await matchReaderShell(cache);
      if (shell) {
        return shell;
      }
    }

    return offlineDocument(cache);
  }
}

/**
 * Find any cached reader document usable as an offline shell.
 *
 * Two guards matter here, and their absence is what caused the original
 * outage: skip cache keys that carry RSC markers, and require the stored
 * response to actually be HTML.
 */
async function matchReaderShell(cache) {
  const keys = await cache.keys();
  for (const key of keys) {
    const keyUrl = new URL(key.url);
    if (!keyUrl.pathname.startsWith("/reader/")) {
      continue;
    }
    if (isRscRequest(key)) {
      continue;
    }
    const candidate = await matchDocument(cache, key);
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

/** Cache-first, for immutable and versioned assets only. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const cache = await caches.open(CACHE_NAME);
  const networkResponse = await fetch(request);
  await putInCache(cache, request, networkResponse);
  return networkResponse;
}

/** Network-first with a cache fallback, for everything else. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    await putInCache(cache, request, networkResponse);
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Pick a strategy for a non-navigation, non-RSC, same-origin GET.
 *
 * Deliberately keyed on asset shape rather than on app pathnames — the old
 * pathname allowlist is what let flight payloads in.
 */
function getAssetStrategy(url) {
  // Build-hashed, immutable.
  if (url.pathname.startsWith("/_next/static/")) {
    return "cache-first";
  }

  // The service worker itself must never be served from its own cache, or a
  // broken worker could never be replaced.
  if (url.pathname === "/sw.js") {
    return "network-only";
  }

  if (/\.(png|jpe?g|gif|svg|ico|webp|avif|woff2?|wasm)$/.test(url.pathname)) {
    return "cache-first";
  }

  return "network-first";
}

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Pre-cache a document, verifying it is HTML before storing it. Precaching is
 * the one place we fetch without a user request, so it gets the same guard.
 */
async function precacheDocument(cache, path) {
  try {
    const request = new Request(path);
    const response = await fetch(request);
    if (!isHtmlResponse(response)) {
      console.warn("[sw] Skipping non-HTML precache for", path);
      return;
    }
    await putInCache(cache, request, response);
  } catch (error) {
    console.warn("[sw] Failed to precache", path, error);
  }
}

async function precacheAsset(cache, path) {
  try {
    const request = new Request(path);
    const response = await fetch(request);
    await putInCache(cache, request, response);
  } catch (error) {
    console.warn("[sw] Failed to precache", path, error);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled([
        ...PRECACHED_DOCUMENTS.map((path) => precacheDocument(cache, path)),
        ...PRECACHED_ASSETS.map((path) => precacheAsset(cache, path)),
      ]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Dropping every other `floppy-` cache is what heals clients that were
      // poisoned by an earlier service worker version.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("floppy-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }
  if (!request.url.startsWith("http")) {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Escape hatch: never let the cache stand between the user and a reset.
  if (isResetRequest(url)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await matchDocument(cache, new Request(RESET_URL));
          return cached || offlineDocument(cache);
        }
      })(),
    );
    return;
  }

  // RSC payloads are never cached and never served from cache. This is the
  // single most important line in the file.
  if (isRscRequest(request)) {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
    return;
  }

  const strategy = getAssetStrategy(url);
  if (strategy === "network-only") {
    return;
  }
  if (strategy === "cache-first") {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));
});

self.addEventListener("message", (event) => {
  const data = event.data;
  const type = typeof data === "string" ? data : data?.type;

  if (type === "skipWaiting") {
    self.skipWaiting();
    return;
  }

  if (type === "CLEAR_CACHES") {
    event.waitUntil(
      (async () => {
        await clearAllCaches();
        event.source?.postMessage({ type: "CACHES_CLEARED" });
      })(),
    );
  }
});
