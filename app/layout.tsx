import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const notoSans = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-noto-sans", // 設定 CSS 變數供 Tailwind 使用
});

export const metadata: Metadata = {
  title: "星羽 - 您的得力助手",
  description: "為您的 Discord 伺服器注入強大功能",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className={`${notoSans.className} antialiased bg-mystic text-gray-200 min-h-screen selection:bg-[#9BA3D6] selection:text-[#1E212B]`}>
        {children}
      </body>
    </html>
  );
}