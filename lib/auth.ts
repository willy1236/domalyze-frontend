import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export interface DiscordUser {
  id: string
  username: string
}

// JWT 密鑰，應該從環境變數中獲取
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-please-change-in-production"
)

export async function getSession(): Promise<DiscordUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("jwt")

  if (!sessionCookie) {
    return null
  }

  try {
    // 驗證並解碼 JWT
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET)
    
    // 從 JWT payload 直接取得 DiscordUser 資訊
    const user = payload as unknown as DiscordUser

    return user
  } catch {
    // JWT 無效或已過期
    await destroySession()
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("jwt")
}
