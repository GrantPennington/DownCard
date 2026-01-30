import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Downcard | Free Blackjack",
  description: "Play blackjack online for free. No signup required. 6-deck shoe, dealer stands on soft 17, blackjack pays 3:2.",
  keywords: ["blackjack", "card game", "casino", "free", "online", "no signup"],
  authors: [{ name: "Downcard" }],
  openGraph: {
    title: "Downcard | Free Blackjack",
    description: "Play blackjack online for free. No signup required.",
    type: "website",
    locale: "en_US",
    siteName: "Downcard",
  },
  twitter: {
    card: "summary",
    title: "Downcard | Free Blackjack",
    description: "Play blackjack online for free. No signup required.",
  },
  icons: {
    icon: "/icon-logo.svg",
    apple: "/icon-logo.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
