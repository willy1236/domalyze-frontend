import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ServerOverview } from "@/components/server-overview"
import { ActivityChart } from "@/components/activity-chart"
import { ModerationPanel } from "@/components/moderation-panel"
import { QuickActions } from "@/components/quick-actions"

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ServerOverview />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart />
        <QuickActions />
      </div>
      <ModerationPanel />
    </main>
  )
}
