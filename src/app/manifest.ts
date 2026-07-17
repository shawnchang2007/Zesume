import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zesume Free AI Resume & CV Builder",
    short_name: "Zesume",
    description:
      "Start free with fact-safe AI resume and CV building for students and early-career applicants.",
    start_url: "/app",
    display: "standalone",
    background_color: "#fbfcfd",
    theme_color: "#d8f6e9",
    icons: [
      {
        src: "/favicon-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
