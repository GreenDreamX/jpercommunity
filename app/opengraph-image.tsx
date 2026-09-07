import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "JPER Community - Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1C1B1A 0%, #2B3A55 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#B23A2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "28px",
              color: "white",
            }}
          >
            日
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#E4E1DA", letterSpacing: "2px" }}>
            JPER COMMUNITY
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            Belajar Bahasa Jepang Bareng, dari Nol Sampai Bisa.
          </div>
          <div style={{ fontSize: "22px", color: "#A8A29E" }}>
            Ekstrakurikuler Bahasa Jepang &amp; LMS Terpadu — SMKN 1 Majalaya
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            fontSize: "18px",
            color: "#FAF9F6",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            paddingTop: "24px",
            width: "100%",
          }}
        >
          <span>🌸 Hiragana &amp; Katakana</span>
          <span>•</span>
          <span>📚 Bunpou &amp; Kaiwa</span>
          <span>•</span>
          <span>🎮 Arcade Push Rank</span>
          <span>•</span>
          <span style={{ color: "#F59E0B", fontWeight: "bold" }}>jper.my.id</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
