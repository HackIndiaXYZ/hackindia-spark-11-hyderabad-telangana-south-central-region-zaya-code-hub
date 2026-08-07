import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zing — Build Your Startup in Minutes",
  description:
    "Harness 6 specialized Gemini-powered AI agents to generate your business plan, competitor analysis, financial model, branding, website, and investor pitch deck automatically.",
  keywords: "AI startup, business plan generator, pitch deck, market research, AI agents, Gemini",
  icons: {
    icon: "/cropped_circle_image.png",
    apple: "/cropped_circle_image.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
