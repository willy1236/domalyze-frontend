import { Bot } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Xingyu</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">為 Discord 社群打造的全方位機器人解決方案</p>
          </div>

          {/*<div>
            <h4 className="font-semibold mb-4">產品</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  功能
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  定價
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  更新日誌
                </a>
              </li>
            </ul>
          </div>*/}

          {/*<div>
            <h4 className="font-semibold mb-4">資源</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  文檔
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  支援
                </a>
              </li>
            </ul>
          </div>*/}

          <div>
            <h4 className="font-semibold mb-4">社群</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://discord.gg/P4jqdcMxkH" className="hover:text-foreground transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://linktr.ee/Xingyu1016" className="hover:text-foreground transition-colors">
                  Linktree
                </a>
              </li>
              <li>
                <a href="https://github.com/willy1236/XingyuBot" className="hover:text-foreground transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 析域工作室 Domalyze Studio. 版權所有。</p>
        </div>
      </div>
    </footer>
  )
}
