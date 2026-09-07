import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JPER Community LMS — SMKN 1 Majalaya",
    short_name: "JPER LMS",
    description: "Portal Manajemen Ekstrakurikuler & Pembelajaran Bahasa Jepang SMKN 1 Majalaya.",
    start_url: "/lms",
    display: "standalone",
    background_color: "#FAF9F6",
    theme_color: "#2B3A55",
    icons: [
      {
        src: "/image/J-PER.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/image/J-PER.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
