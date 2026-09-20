import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { LanguageInit } from "@/components/ui/language-init";
import { AudioInit } from "@/components/ui/audio-init";
import { AuthProvider } from "@/components/auth/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BLUFF.AI | 骗过 AI",
  description: "三张牌 × AI 心理博弈 × Roguelike Buff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh"
      data-lang="zh"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <AuthProvider>
          <LanguageInit />
          <AudioInit />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
