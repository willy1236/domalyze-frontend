import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, Activity, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "總成員數",
    value: "12,458",
    change: "+12.5%",
    icon: Users,
    color: "text-chart-1",
  },
  {
    title: "今日訊息",
    value: "3,842",
    change: "+8.2%",
    icon: MessageSquare,
    color: "text-chart-2",
  },
  {
    title: "活躍用戶",
    value: "8,234",
    change: "+15.3%",
    icon: Activity,
    color: "text-chart-3",
  },
  {
    title: "互動率",
    value: "66.2%",
    change: "+4.1%",
    icon: TrendingUp,
    color: "text-chart-4",
  },
]

export function ServerOverview() {
  return (
    <>
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-chart-1">{stat.change}</span> 較上週
              </p>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}
