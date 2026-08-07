import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Startup Builder — Build Your Startup in Minutes",
  description:
    "Harness 6 specialized Gemini-powered AI agents to generate your business plan, competitor analysis, financial model, branding, website, and investor pitch deck automatically.",
  keywords: "AI startup, business plan generator, pitch deck, market research, AI agents, Gemini",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
