import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary" >
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Xingyu</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              功能
            </Link>
            {/*<a href="/#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              統計
            </a>
            <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              文檔
            </a>*/}
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              儀表板
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">登入</Link>
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" >
              邀請機器人
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
