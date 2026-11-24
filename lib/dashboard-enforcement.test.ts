import { describe, expect, it } from "vitest"
import { canLift, type EnforcementEntry } from "./dashboard-enforcement"

describe("canLift", () => {
  it.each<[EnforcementEntry["action"], EnforcementEntry["status"], boolean]>([
    ["delete", "ok", false],
    ["timeout", "failed", false],
    ["ban", "failed", false],
    ["timeout", "ok", true],
    ["ban", "ok", true],
  ])("%s / %s 解除處罰按鈕資格為 %s", (action, status, allowed) => {
    expect(canLift({ action, status })).toBe(allowed)
  })
})
