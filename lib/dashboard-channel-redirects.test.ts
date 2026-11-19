import { describe, expect, it } from "vitest"
import nextConfig from "../next.config"
import { CHANNEL_LIST_PATH, channelPath } from "./dashboard-channel"

describe("頻道後台舊網址", () => {
  it("/dashboard/channels 與其子路徑永久導到新網址", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? []
    expect(redirects).toContainEqual({ source: "/dashboard/channels", destination: CHANNEL_LIST_PATH, permanent: true })
    expect(redirects).toContainEqual({
      source: "/dashboard/channels/:path*",
      destination: `${CHANNEL_LIST_PATH}/:path*`,
      permanent: true,
    })
  })
  it("新網址由 channelPath 組出", () => {
    expect(CHANNEL_LIST_PATH).toBe("/dashboard/twitch")
    expect(channelPath("7")).toBe("/dashboard/twitch/7")
  })
})
