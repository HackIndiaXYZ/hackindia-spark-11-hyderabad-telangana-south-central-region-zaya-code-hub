import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import Script from "next/script";
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
  keywords: "AI startup, business plan generator, pitch deck, market research, AI agents, Gemini, Mutagent, automated business plan, startup builder",
  authors: [{ name: "Zing AI" }],
  creator: "Zing",
  publisher: "Zing",
  robots: "index, follow",
  openGraph: {
    title: "Zing — Build Your Startup in Minutes",
    description: "Harness 6 specialized Gemini-powered AI agents to generate your business plan, financial model, and pitch deck automatically.",
    url: "https://zing.ai",
    siteName: "Zing",
    images: [
      {
        url: "/cropped_circle_image.png",
        width: 800,
        height: 600,
        alt: "Zing AI Startup Builder",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zing — Build Your Startup in Minutes",
    description: "Harness 6 specialized Gemini-powered AI agents to generate your business plan, financial model, and pitch deck automatically.",
    creator: "@zing_ai",
    images: ["/cropped_circle_image.png"],
  },
  verification: {
    google: "MwDU72YvAqwzNKzVsz0L2loEbvRM-krlOxWXulAOtTg",
  },
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
      <body>
        {children}
        <Script
          id="ai-widget"
          type="module"
          strategy="afterInteractive"
        >
          {`
            import { embedWidget } from "https://cdn.jsdelivr.net/npm/agent-embed-widget/dist/agent-embed-widget.es.js";

            embedWidget({
              type: "tray",
              url: "https://console.thesys.dev/app/BxC4Ylrouq4-kyAD2eVg-",
              theme: "light",
            });
          `}
        </Script>
      </body>
    </html>
  );
}
