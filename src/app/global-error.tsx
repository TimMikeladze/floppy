"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global-error] Caught critical error:", error)
  }, [error])

  const handleHardReset = async () => {
    try {
      // Clear service worker caches
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.filter(name => name.startsWith("floppy-")).map(name => caches.delete(name))
        )
      }

      // Unregister service worker
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(reg => reg.unregister()))
      }

      // Force reload
      window.location.reload()
    } catch (e) {
      console.error("[global-error] Failed to perform hard reset:", e)
      window.location.reload()
    }
  }

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#0d0d0d",
            color: "#fafafa",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                margin: "0 auto 1.5rem",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
              A critical error occurred. Please try resetting the app.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#fafafa",
                  color: "#0d0d0d",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Try Again
              </button>

              <button
                onClick={handleHardReset}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "transparent",
                  color: "#a1a1aa",
                  border: "1px solid #27272a",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
