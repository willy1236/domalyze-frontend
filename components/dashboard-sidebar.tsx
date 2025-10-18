"use client"

import { Bot, Home, Shield, Users, MessageSquare, Settings, BarChart3, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const menuItems = [
  { icon: Home, label: "總覽", href: "#overview" },
  { icon: BarChart3, label: "統計數據", href: "#stats" },
  { icon: Users, label: "成員管理", href: "#members" },
  { icon: Shield, label: "審核工具", href: "#moderation" },
  { icon: MessageSquare, label: "訊息記錄", href: "#logs" },
  { icon: Zap, label: "自動化", href: "#automation" },
  { icon: Settings, label: "設定", href: "#settings" },
]

export function DashboardSidebar() {
  const [activeItem, setActiveItem] = useState("總覽")

  return (
    <aside className="w-64 border-r border-border/50 backdrop-blur-sm flex flex-col">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">Xingyu</span>
            <p className="text-xs text-muted-foreground">管理面板</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.label
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setActiveItem(item.label)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-card rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">升級至專業版</p>
          <p className="text-xs text-muted-foreground">解鎖更多進階功能</p>
          <button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm py-2 rounded-md transition-colors">
            立即升級
          </button>
        </div>
      </div>
    </aside>
  )
}
