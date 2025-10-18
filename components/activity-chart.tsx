"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { date: "週一", messages: 2400, members: 1200 },
  { date: "週二", messages: 3200, members: 1398 },
  { date: "週三", messages: 2800, members: 1800 },
  { date: "週四", messages: 3900, members: 1908 },
  { date: "週五", messages: 4200, members: 2200 },
  { date: "週六", messages: 3800, members: 2500 },
  { date: "週日", messages: 3400, members: 2100 },
]

const chartConfig = {
  messages: {
    label: "訊息數",
    color: "hsl(var(--chart-1))",
  },
  members: {
    label: "活躍成員",
    color: "hsl(var(--chart-2))",
  },
}

export function ActivityChart() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle>本週活動趨勢</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="messages"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="members"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
