import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zesume | AI Resume Rewriter",
  description: "Rewrite your resume for SWE, Quant, and Finance applications.",
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
