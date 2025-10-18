import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, UserPlus, Ban, Megaphone } from "lucide-react"

const actions = [
  {
    title: "發送公告",
    description: "向所有成員發送重要訊息",
    icon: Megaphone,
    color: "bg-chart-1/10 text-chart-1",
  },
  {
    title: "邀請成員",
    description: "生成邀請連結",
    icon: UserPlus,
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    title: "審核管理",
    description: "查看待處理的審核項目",
    icon: Ban,
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    title: "批量訊息",
    description: "向特定群組發送訊息",
    icon: Send,
    color: "bg-chart-4/10 text-chart-4",
  },
]

export function QuickActions() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle>快速操作</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto justify-start p-4 hover:bg-secondary/50 bg-transparent"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${action.color} mr-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
