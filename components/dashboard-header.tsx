import { Button } from "@/components/ui/button"
import { Bell, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DiscordUser } from "@/lib/auth"

const base_api_url = process.env.NEXT_PUBLIC_BASE_API_URL;

interface DashboardHeaderProps {
  user: DiscordUser
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const avatar_url = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : null

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-balance">伺服器管理儀表板</h1>
          <p className="text-sm text-muted-foreground">管理您的 Discord 伺服器設定（敬請期待）</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={avatar_url || undefined} alt={user.username} />
                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.username}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                設定
              </DropdownMenuItem>
              <DropdownMenuItem>個人資料</DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={`${base_api_url}/logout`} method="GET">
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    登出
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
