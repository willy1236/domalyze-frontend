"use client"

import { OpsChannelList } from "@/components/dashboard/ops/ops-channel-list"

export default function OpsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-serif">營運</h1>
      <OpsChannelList />
    </section>
  )
}
