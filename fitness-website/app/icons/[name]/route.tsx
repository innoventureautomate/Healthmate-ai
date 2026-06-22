import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

const SIZES: Record<string, number> = {
  "icon-192.png": 192,
  "icon-512.png": 512,
  "apple-touch-icon.png": 180,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const size = SIZES[name] ?? 192;
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.28);
  const tagSize = Math.round(size * 0.13);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0f766e 0%, #0891b2 100%)",
          borderRadius: radius,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: Math.round(size * 0.04),
          }}
        >
          {/* Heart icon made from two overlapping circles + triangle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              width: Math.round(size * 0.42),
              height: Math.round(size * 0.38),
            }}
          >
            <svg
              width={Math.round(size * 0.42)}
              height={Math.round(size * 0.38)}
              viewBox="0 0 42 38"
              fill="none"
            >
              {/* Heart */}
              <path
                d="M21 35s-18-10.5-18-20.5a10.5 10.5 0 0 1 18-7.35A10.5 10.5 0 0 1 39 14.5C39 24.5 21 35 21 35z"
                fill="white"
                fillOpacity="0.95"
              />
              {/* ECG pulse line through heart */}
              <polyline
                points="5,19 10,19 13,13 16,25 19,16 22,22 25,19 37,19"
                stroke="#0f766e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          {/* App name tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.18)",
              borderRadius: Math.round(size * 0.05),
              paddingLeft: Math.round(size * 0.06),
              paddingRight: Math.round(size * 0.06),
              paddingTop: Math.round(size * 0.025),
              paddingBottom: Math.round(size * 0.025),
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: tagSize,
                fontWeight: 800,
                letterSpacing: 1,
                fontFamily: "sans-serif",
              }}
            >
              HEALTHMATE
            </span>
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
