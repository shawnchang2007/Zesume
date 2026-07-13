import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://zesume.xyz"),
  applicationName: "Zesume",
  title: {
    default: "Zesume: AI Resume Rewriter for Students",
    template: "%s | Zesume",
  },
  description:
    "Rewrite student resumes for SWE, Quant, Finance, and general applications with fact-safe AI, career-specific templates, and DOCX export.",
  keywords: [
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
    title: "Zesume: AI Resume Rewriter for Students",
    description:
      "Fact-safe AI resume rewriting for SWE, Quant, Finance, and early-career applications.",
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
    title: "Zesume: AI Resume Rewriter for Students",
    description:
      "Fact-safe, career-focused resume rewriting for university students.",
    images: ["/brand/zesume-social-card.png"],
  },
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
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
