/**
 * A minimal ServiceWorkerGlobalScope emulator for exercising `public/sw.js`
 * under `bun test`.
 *
 * It implements just enough of the Cache API, the fetch event, and the worker
 * lifecycle to assert on caching behavior. Deliberately dependency-free so the
 * service worker can be tested without a browser or a build step.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const ORIGIN = "https://floppy.sh";

/** Resolves relative URLs against the worker scope, like a real SW does. */
class SwRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === "string" && input.startsWith("/")) {
      input = new URL(input, ORIGIN).toString();
    }
    super(input as RequestInfo, init);
  }
}

/**
 * Build a top-level navigation request.
 *
 * The Fetch spec forbids constructing a Request with `mode: "navigate"`, so the
 * property is installed on the instance instead.
 */
export function navigationRequest(path: string, init?: RequestInit): Request {
  const request = new SwRequest(path, init);
  Object.defineProperty(request, "mode", {
    value: "navigate",
    configurable: true,
  });
  return request;
}

export function assetRequest(path: string, init?: RequestInit): Request {
  return new SwRequest(path, init);
}

export function htmlResponse(body = "<!doctype html><title>ok</title>") {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** A React Server Component flight payload — the response that caused the outage. */
export function flightResponse(body = '0:{"b":"build","f":[[["",{}]]]}') {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/x-component" },
  });
}

class FakeCache {
  entries: Array<{ request: Request; response: Response }> = [];

  async match(request: RequestInfo): Promise<Response | undefined> {
    const url = toUrl(request);
    const entry = this.entries.find((e) => e.request.url === url);
    return entry ? entry.response.clone() : undefined;
  }

  async put(request: RequestInfo, response: Response): Promise<void> {
    const url = toUrl(request);
    const key =
      typeof request === "string"
        ? new SwRequest(request)
        : (request as Request);
    const existing = this.entries.findIndex((e) => e.request.url === url);
    if (existing !== -1) {
      this.entries.splice(existing, 1);
    }
    this.entries.push({ request: key, response });
  }

  async delete(request: RequestInfo): Promise<boolean> {
    const url = toUrl(request);
    const index = this.entries.findIndex((e) => e.request.url === url);
    if (index === -1) {
      return false;
    }
    this.entries.splice(index, 1);
    return true;
  }

  async keys(): Promise<Request[]> {
    return this.entries.map((e) => e.request);
  }

  /** Test helper: the URLs currently stored. */
  urls(): string[] {
    return this.entries.map((e) => e.request.url);
  }
}

function toUrl(request: RequestInfo): string {
  if (typeof request === "string") {
    return new URL(request, ORIGIN).toString();
  }
  return (request as Request).url;
}

class FakeCacheStorage {
  caches = new Map<string, FakeCache>();

  async open(name: string): Promise<FakeCache> {
    let cache = this.caches.get(name);
    if (!cache) {
      cache = new FakeCache();
      this.caches.set(name, cache);
    }
    return cache;
  }

  async keys(): Promise<string[]> {
    return [...this.caches.keys()];
  }

  async delete(name: string): Promise<boolean> {
    return this.caches.delete(name);
  }

  async match(request: RequestInfo): Promise<Response | undefined> {
    for (const cache of this.caches.values()) {
      const hit = await cache.match(request);
      if (hit) {
        return hit;
      }
    }
    return undefined;
  }
}

export type NetworkHandler = (request: Request) => Promise<Response> | Response;

export interface SwHarness {
  caches: FakeCacheStorage;
  /** Replace the simulated network. Throwing simulates being offline. */
  setNetwork(handler: NetworkHandler): void;
  goOffline(): void;
  install(): Promise<void>;
  activate(): Promise<void>;
  /** Returns the response, or `null` when the worker did not intercept. */
  fetch(request: Request): Promise<Response | null>;
  message(data: unknown): Promise<void>;
  cache(name?: string): Promise<FakeCache>;
  cacheName: string;
}

const SW_SOURCE = readFileSync(
  join(import.meta.dir, "..", "public", "sw.js"),
  "utf8",
);

/** Cache name the worker is currently writing to, parsed from the source. */
export const CACHE_NAME = (() => {
  const match = SW_SOURCE.match(/const CACHE_VERSION = "([^"]+)"/);
  if (!match) {
    throw new Error("Could not parse CACHE_VERSION from sw.js");
  }
  return `floppy-${match[1]}`;
})();

export function createSwHarness(): SwHarness {
  const cacheStorage = new FakeCacheStorage();
  const listeners = new Map<string, Array<(event: unknown) => void>>();

  let network: NetworkHandler = () => htmlResponse();

  const swFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request =
      input instanceof Request ? input : new SwRequest(input as string, init);
    return network(request);
  };

  const self = {
    location: new URL(ORIGIN),
    addEventListener(type: string, handler: (event: unknown) => void) {
      const existing = listeners.get(type) || [];
      existing.push(handler);
      listeners.set(type, existing);
    },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };

  // Evaluate the real worker source against the emulated globals.
  const factory = new Function(
    "self",
    "caches",
    "fetch",
    "Request",
    "Response",
    "URL",
    "console",
    SW_SOURCE,
  );
  factory(self, cacheStorage, swFetch, SwRequest, Response, URL, console);

  async function dispatch(
    type: string,
    event: Record<string, unknown>,
  ): Promise<void> {
    const handlers = listeners.get(type) || [];
    for (const handler of handlers) {
      handler(event);
    }
  }

  async function lifecycle(type: string): Promise<void> {
    const waits: Array<Promise<unknown>> = [];
    await dispatch(type, {
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
    });
    await Promise.all(waits);
  }

  return {
    caches: cacheStorage,
    cacheName: CACHE_NAME,
    setNetwork(handler) {
      network = handler;
    },
    goOffline() {
      network = () => {
        throw new TypeError("Failed to fetch");
      };
    },
    install: () => lifecycle("install"),
    activate: () => lifecycle("activate"),
    async fetch(request) {
      let responded: Promise<Response> | null = null;
      const waits: Array<Promise<unknown>> = [];
      await dispatch("fetch", {
        request,
        respondWith: (promise: Promise<Response>) => {
          responded = promise;
        },
        waitUntil: (promise: Promise<unknown>) => waits.push(promise),
      });
      await Promise.all(waits);
      // `null` means the worker fell through to the browser's own network path.
      return responded ? await responded : null;
    },
    async message(data) {
      const waits: Array<Promise<unknown>> = [];
      await dispatch("message", {
        data,
        source: { postMessage: () => {} },
        waitUntil: (promise: Promise<unknown>) => waits.push(promise),
      });
      await Promise.all(waits);
    },
    cache: (name = CACHE_NAME) => cacheStorage.open(name),
  };
}
