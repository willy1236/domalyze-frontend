import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display, LXGW_WenKai_TC, Ysabeau_Infant } from "next/font/google"
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

// 星羽元件庫：中文霞鶩文楷 TC（只載 300／400），數字與英文交給 Ysabeau Infant。
const lxgw = LXGW_WenKai_TC({
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-lxgw",
})

const ysabeau = Ysabeau_Infant({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "600"],
  display: "swap",
  variable: "--font-ysabeau",
})

export const metadata: Metadata = {
  title: "星羽 Discord 機器人 - 頂級社群管理",
  description: "體驗 Discord 社群管理的巔峰之作。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${lxgw.variable} ${ysabeau.variable} bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans antialiased relative overflow-x-hidden selection:bg-primary selection:text-white transition-colors duration-500`} suppressHydrationWarning>
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
