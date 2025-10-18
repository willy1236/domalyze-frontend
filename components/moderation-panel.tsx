import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

const moderationItems = [
  {
    id: 1,
    user: "User#1234",
    action: "垃圾訊息檢測",
    severity: "high",
    time: "2 分鐘前",
    status: "pending",
  },
  {
    id: 2,
    user: "User#5678",
    action: "不當內容舉報",
    severity: "medium",
    time: "15 分鐘前",
    status: "pending",
  },
  {
    id: 3,
    user: "User#9012",
    action: "頻繁訊息警告",
    severity: "low",
    time: "1 小時前",
    status: "resolved",
  },
]

export function ModerationPanel() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-chart-1" />
          審核待處理項目
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {moderationItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{item.user}</span>
                  <Badge
                    variant={
                      item.severity === "high" ? "destructive" : item.severity === "medium" ? "default" : "secondary"
                    }
                  >
                    {item.severity === "high" ? "高" : item.severity === "medium" ? "中" : "低"}
                  </Badge>
                  {item.status === "resolved" && (
                    <Badge variant="outline" className="text-chart-1">
                      已處理
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
              </div>
              {item.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-chart-1 bg-transparent">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    批准
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                    <XCircle className="w-4 h-4 mr-1" />
                    拒絕
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
