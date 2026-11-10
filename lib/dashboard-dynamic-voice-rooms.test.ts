import { describe, expect, it } from "vitest"
import { formatCreatedAt } from "./dashboard-dynamic-voice-rooms"

describe("formatCreatedAt", () => {
  it("月/日 時:分，依指定時區", () => {
    expect(formatCreatedAt("2026-11-10T09:05:00Z", "Asia/Taipei")).toBe("11/10 17:05")
    expect(formatCreatedAt("2026-11-10T20:05:00Z", "Asia/Taipei")).toBe("11/11 04:05")
  })
})
