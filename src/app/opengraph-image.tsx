import { ImageResponse } from "next/og";

export const alt = "Floppy — The Comic Book App";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#0d0d0d",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle gradient accent */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: "72px",
          fontWeight: 700,
          color: "#ededed",
          letterSpacing: "-2px",
          marginBottom: "16px",
        }}
      >
        Floppy
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: "32px",
          fontWeight: 400,
          color: "rgba(237,237,237,0.6)",
          letterSpacing: "-0.5px",
        }}
      >
        the comic book app
      </div>

      {/* URL */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          fontSize: "20px",
          color: "rgba(237,237,237,0.3)",
          letterSpacing: "1px",
        }}
      >
        floppy.sh
      </div>
    </div>,
    { ...size },
  );
}
