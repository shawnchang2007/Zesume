import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zesume AI Resume Rewriter",
    short_name: "Zesume",
    description:
      "Fact-safe AI resume rewriting for students and early-career applicants.",
    start_url: "/app",
    display: "standalone",
    background_color: "#fbfcfd",
    theme_color: "#d8f6e9",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
