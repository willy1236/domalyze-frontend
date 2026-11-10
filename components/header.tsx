"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <header className="top-0 left-0 w-full z-40 border-b border-champagne/30 dark:border-champagne/20 relative">
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-silver/40 to-transparent"></div>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">
        <a href="/" className="text-2xl font-serif tracking-widest text-primary uppercase flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/xingyu-mark.svg" alt="" width={40} height={40} className="w-10 h-10 dark:brightness-[1.3] drop-shadow-[0_0_8px_rgba(196,208,232,0.35)]" /> Xingyu
        </a>
        <nav className="hidden md:flex items-center">
          <div className="nav-item flex items-center">
            <a className="text-sm tracking-[0.2em] uppercase text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" href="/features">功能</a>
            <span className="nav-separator"></span>
          </div>
          <div className="nav-item flex items-center ml-6">
            <a className="text-sm tracking-[0.2em] uppercase text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" href="#commands">指令</a>
          </div>
        </nav>
        <div className="flex items-center space-x-4 sm:space-x-6">
          <button 
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {mounted && theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <a className="text-xs sm:text-sm tracking-[0.2em] uppercase text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap" href="/dashboard">管理後台</a>
          <a className="hidden sm:inline-block border border-primary/30 dark:border-champagne/40 text-primary dark:text-champagne px-6 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-primary hover:text-white dark:hover:bg-champagne dark:hover:text-background-dark transition-all duration-300 relative group" href="/#preorder">
            <span className="absolute inset-0 bg-champagne/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            <span className="relative z-10">邀請</span>
          </a>
        </div>
      </div>
    </header>
  )
}
