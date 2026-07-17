import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://zesume.xyz"),
  applicationName: "Zesume",
  title: {
    default: "Free AI Resume & CV Builder for Students | Zesume",
    template: "%s | Zesume",
  },
  description:
    "Start free with Zesume, an AI resume and CV builder for students. Tailor applications for SWE, Quant, Finance, and general roles, then export to DOCX.",
  keywords: [
    "free AI resume builder",
    "AI CV builder",
    "AI resume rewriter",
    "student resume builder",
    "SWE resume",
    "quant resume",
    "finance resume",
    "ATS resume",
  ],
  creator: "Zesume",
  publisher: "Zesume",
  category: "career tools",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Zesume",
    title: "Free AI Resume & CV Builder for Students | Zesume",
    description:
      "Start free and build a fact-safe, career-focused resume or CV for SWE, Quant, Finance, and early-career applications.",
    url: "/",
    images: [
      {
        url: "/brand/zesume-social-card.png",
        width: 1200,
        height: 630,
        alt: "Zesume AI resume rewriting for students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Resume & CV Builder for Students | Zesume",
    description:
      "Start free with fact-safe AI resume and CV building for university students.",
    images: ["/brand/zesume-social-card.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#d8f6e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
