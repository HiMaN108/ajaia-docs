import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ICON_FONT_URL } from "@/components/icon-names";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ajaia Docs",
  description: "A lightweight collaborative document editor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}>
      <head>
        {/* Icon font, subset to the glyphs the app uses (see icon-names.ts). */}
        <link rel="stylesheet" href={ICON_FONT_URL} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
