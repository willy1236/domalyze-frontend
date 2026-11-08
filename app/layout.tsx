import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display, LXGW_WenKai_TC } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
})

// 中文字型：Inter／Playfair 沒有中文字形，中文字元會落到這裡。
// CJK 字型被切成上百個 unicode-range 分片，preload 會讓首屏一次下載全部，所以關掉，改由瀏覽器按實際用字載入。
const lxgw = LXGW_WenKai_TC({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
  variable: "--font-lxgw",
})

export const metadata: Metadata = {
  title: "星羽 Xingyu｜Discord 社群機器人",
  description:
    "Discord 社群機器人：跨群警告紀錄、Ticket 私人頻道、Twitch／YouTube／X 開台推播、中央氣象署地震與天氣通知，以及遊戲玩家資料查詢。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${lxgw.variable} bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans antialiased relative overflow-x-hidden selection:bg-primary selection:text-white transition-colors duration-500`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
