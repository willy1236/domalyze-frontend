import { getSession } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children, // 這裡會動態替換成 page.tsx 的內容
}: {
  children: React.ReactNode;
}) {
  const user = await getSession()
  if (!user) {
    redirect("/login")
  }
  
  return (
    <div className="relative min-h-screen">
      <div className="star-field fixed inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 flex">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader user={user} />
          <main className="flex-1 p-6 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}