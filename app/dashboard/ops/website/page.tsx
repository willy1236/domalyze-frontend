"use client"

import { OpsTabs } from "@/components/dashboard/ops/ops-tabs"
import { OpsWebsite } from "@/components/dashboard/ops/ops-website"

export default function OpsWebsitePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-serif">營運</h1>
      <OpsTabs />
      <OpsWebsite />
    </section>
  )
}
