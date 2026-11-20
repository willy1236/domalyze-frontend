"use client"

import { OpsSystem } from "@/components/dashboard/ops/ops-system"
import { OpsTabs } from "@/components/dashboard/ops/ops-tabs"

export default function OpsSystemPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-serif">營運</h1>
      <OpsTabs />
      <OpsSystem />
    </section>
  )
}
