"use client"

import { OpsDiscord } from "@/components/dashboard/ops/ops-discord"
import { OpsTabs } from "@/components/dashboard/ops/ops-tabs"

export default function OpsDiscordPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-serif">營運</h1>
      <OpsTabs />
      <OpsDiscord />
    </section>
  )
}
