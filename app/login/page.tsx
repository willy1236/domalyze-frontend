import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="star-field fixed inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md px-4">
        <LoginForm />
      </div>
    </div>
  )
}
