/**
 * Regression tests for the Floppy service worker.
 *
 * The outage these guard against: the worker cached a React Server Component
 * flight payload for a `/reader/<id>` URL and later served it in response to a
 * top-level navigation. The browser painted the raw payload as text, React never
 * booted, and every in-app recovery path became unreachable.
 *
 * The invariant under test is deliberately blunt — a navigation is only ever
 * answered with HTML — because it makes the whole class of failure impossible,
 * not just the one path that triggered it.
 */

import { beforeEach, describe, expect, test } from "bun:test";
import {
  assetRequest,
  CACHE_NAME,
  createSwHarness,
  flightResponse,
  htmlResponse,
  navigationRequest,
  type SwHarness,
} from "./sw-harness";

function contentType(response: Response | null): string {
  return response?.headers.get("Content-Type")?.toLowerCase() ?? "";
}

/** Routes a simulated network by path, the way the real origin would. */
function defaultNetwork(request: Request): Response {
  const { pathname } = new URL(request.url);
  if (pathname.endsWith(".wasm") || pathname.endsWith(".png")) {
    return new Response("binary", {
      headers: { "Content-Type": "application/octet-stream" },
    });
  }
  if (pathname.endsWith(".js")) {
    return new Response("//js", {
      headers: { "Content-Type": "application/javascript" },
    });
  }
  if (pathname.endsWith(".json")) {
    return new Response("{}", {
      headers: { "Content-Type": "application/json" },
    });
  }
  return htmlResponse(`<!doctype html><title>${pathname}</title>`);
}

let sw: SwHarness;

beforeEach(() => {
  sw = createSwHarness();
  sw.setNetwork(defaultNetwork);
});

describe("navigation invariant: only HTML is ever served to a document request", () => {
  test("a poisoned reader cache entry is never served as a document", async () => {
    // Exactly the state the old worker could reach: a flight payload stored
    // under a reader URL.
    const cache = await sw.cache();
    await cache.put(assetRequest("/reader/comic-a"), flightResponse());

    sw.goOffline();
    const response = await sw.fetch(navigationRequest("/reader/comic-b"));

    expect(response).not.toBeNull();
    expect(contentType(response)).toContain("text/html");
    // The literal symptom from the bug report.
    expect(await response!.text()).not.toContain('0:{"b":');
  });

  test("the poisoned entry is evicted so the app heals itself", async () => {
    const cache = await sw.cache();
    await cache.put(assetRequest("/reader/comic-a"), flightResponse());

    sw.goOffline();
    await sw.fetch(navigationRequest("/reader/comic-b"));

    expect(cache.urls()).not.toContain("https://floppy.sh/reader/comic-a");
  });

  test("a poisoned entry for the exact URL is not served either", async () => {
    const cache = await sw.cache();
    await cache.put(assetRequest("/library"), flightResponse());

    sw.goOffline();
    const response = await sw.fetch(navigationRequest("/library"));

    expect(contentType(response)).toContain("text/html");
    expect(cache.urls()).not.toContain("https://floppy.sh/library");
  });

  test("an offline reader navigation reuses a cached reader document", async () => {
    const cache = await sw.cache();
    await cache.put(
      assetRequest("/reader/comic-a"),
      htmlResponse("<!doctype html><title>reader shell</title>"),
    );

    sw.goOffline();
    const response = await sw.fetch(navigationRequest("/reader/comic-b"));

    expect(contentType(response)).toContain("text/html");
    expect(await response!.text()).toContain("reader shell");
  });

  test("RSC-keyed reader entries are skipped when choosing an offline shell", async () => {
    const cache = await sw.cache();
    // A flight payload whose cache key still looks like a reader URL.
    await cache.put(
      assetRequest("/reader/comic-a?_rsc=abc123"),
      flightResponse(),
    );
    await cache.put(
      assetRequest("/reader/comic-c"),
      htmlResponse("<!doctype html><title>reader shell</title>"),
    );

    sw.goOffline();
    const response = await sw.fetch(navigationRequest("/reader/comic-b"));

    expect(await response!.text()).toContain("reader shell");
  });

  test("falls back to the offline shell when nothing usable is cached", async () => {
    await sw.install();
    sw.goOffline();

    const response = await sw.fetch(navigationRequest("/reader/comic-b"));

    expect(contentType(response)).toContain("text/html");
    expect(await response!.text()).toContain("offline");
  });

  test("synthesizes an HTML document even with a completely empty cache", async () => {
    sw.goOffline();

    const response = await sw.fetch(navigationRequest("/library"));

    expect(contentType(response)).toContain("text/html");
    expect(response!.status).toBe(503);
  });

  test("a flight payload from the network is never written to the document cache", async () => {
    // A misconfigured origin or edge rewrite answering a navigation with a
    // flight payload must not contaminate the cache for later loads.
    sw.setNetwork(() => flightResponse());
    await sw.fetch(navigationRequest("/library"));

    const cache = await sw.cache();
    expect(cache.urls()).not.toContain("https://floppy.sh/library");
  });
});

describe("RSC requests are never intercepted", () => {
  const cases: Array<[string, Request]> = [
    ["RSC header", assetRequest("/library", { headers: { RSC: "1" } })],
    ["_rsc query param", assetRequest("/library?_rsc=abc123")],
    [
      "text/x-component accept",
      assetRequest("/library", { headers: { Accept: "text/x-component" } }),
    ],
    [
      "router prefetch header",
      assetRequest("/library", { headers: { "Next-Router-Prefetch": "1" } }),
    ],
    [
      "router state tree header",
      assetRequest("/reader/comic-a", {
        headers: { "Next-Router-State-Tree": "%5B%22%22%2C%7B%7D%5D" },
      }),
    ],
    [
      "segment prefetch header",
      assetRequest("/reader/comic-a", {
        headers: { "Next-Router-Segment-Prefetch": "/_tree" },
      }),
    ],
  ];

  for (const [name, request] of cases) {
    test(`${name} passes through untouched`, async () => {
      const response = await sw.fetch(request);
      // `null` means the worker did not call respondWith — the browser handles
      // it directly, so nothing can be cached or replayed.
      expect(response).toBeNull();
    });
  }

  test("no RSC response ends up in the cache", async () => {
    sw.setNetwork(() => flightResponse());
    for (const [, request] of cases) {
      await sw.fetch(request);
    }

    const cache = await sw.cache();
    expect(cache.urls()).toHaveLength(0);
  });
});

describe("navigation strategy", () => {
  test("prefers the network over a stale cached document", async () => {
    const cache = await sw.cache();
    await cache.put(
      assetRequest("/library"),
      htmlResponse("<!doctype html><title>stale</title>"),
    );
    sw.setNetwork(() => htmlResponse("<!doctype html><title>fresh</title>"));

    const response = await sw.fetch(navigationRequest("/library"));

    // Stale documents reference build-hashed chunks that no longer exist after
    // a deploy, so the network must win whenever it is reachable.
    expect(await response!.text()).toContain("fresh");
  });

  test("caches HTML documents fetched from the network", async () => {
    await sw.fetch(navigationRequest("/library"));

    const cache = await sw.cache();
    expect(cache.urls()).toContain("https://floppy.sh/library");
  });

  test("serves the exact cached document when offline", async () => {
    sw.setNetwork(() => htmlResponse("<!doctype html><title>library</title>"));
    await sw.fetch(navigationRequest("/library"));

    sw.goOffline();
    const response = await sw.fetch(navigationRequest("/library"));

    expect(await response!.text()).toContain("library");
  });
});

describe("asset strategies", () => {
  test("the service worker script is never served from cache", async () => {
    const cache = await sw.cache();
    await cache.put(
      assetRequest("/sw.js"),
      new Response("//stale worker", {
        headers: { "Content-Type": "application/javascript" },
      }),
    );

    // A worker that could be served from its own cache could never be replaced.
    const response = await sw.fetch(assetRequest("/sw.js"));
    expect(response).toBeNull();
  });

  test("build-hashed chunks are served cache-first", async () => {
    const url = "/_next/static/chunks/main-abc123.js";
    await sw.fetch(assetRequest(url));

    sw.goOffline();
    const response = await sw.fetch(assetRequest(url));
    expect(response).not.toBeNull();
    expect(await response!.text()).toBe("//js");
  });
});

describe("lifecycle", () => {
  test("install precaches the offline and reset escape hatches", async () => {
    await sw.install();

    const cache = await sw.cache();
    expect(cache.urls()).toContain("https://floppy.sh/offline.html");
    expect(cache.urls()).toContain("https://floppy.sh/reset.html");
  });

  test("install precaches the libarchive worker under its real filename", async () => {
    await sw.install();

    // Regression: the old list precached "/libarchive.js", which does not
    // exist — package.json's postinstall copies it to "/libarchive-worker.js".
    const cache = await sw.cache();
    expect(cache.urls()).toContain("https://floppy.sh/libarchive-worker.js");
    expect(cache.urls()).not.toContain("https://floppy.sh/libarchive.js");
  });

  test("install never precaches a non-HTML response as a document", async () => {
    sw.setNetwork((request) => {
      const { pathname } = new URL(request.url);
      return pathname === "/library"
        ? flightResponse()
        : defaultNetwork(request);
    });

    await sw.install();

    const cache = await sw.cache();
    expect(cache.urls()).not.toContain("https://floppy.sh/library");
  });

  test("activate purges caches from previous worker versions", async () => {
    const stale = await sw.caches.open("floppy-v3");
    await stale.put(assetRequest("/reader/comic-a"), flightResponse());

    await sw.activate();

    expect(await sw.caches.keys()).not.toContain("floppy-v3");
  });

  test("activate keeps the current cache", async () => {
    await sw.install();
    await sw.activate();

    expect(await sw.caches.keys()).toContain(CACHE_NAME);
  });
});

describe("escape hatch", () => {
  test("a sw-reset navigation bypasses the cache entirely", async () => {
    const cache = await sw.cache();
    await cache.put(assetRequest("/?sw-reset=1"), flightResponse());
    sw.setNetwork(() => htmlResponse("<!doctype html><title>fresh</title>"));

    const response = await sw.fetch(navigationRequest("/?sw-reset=1"));

    expect(await response!.text()).toContain("fresh");
  });

  test("the reset page stays reachable offline", async () => {
    await sw.install();
    sw.goOffline();

    const response = await sw.fetch(navigationRequest("/reset.html"));

    expect(contentType(response)).toContain("text/html");
  });

  test("a CLEAR_CACHES message wipes every Floppy cache", async () => {
    await sw.caches.open("floppy-v3");
    await sw.install();

    await sw.message({ type: "CLEAR_CACHES" });

    expect(await sw.caches.keys()).toHaveLength(0);
  });
});
