"use client"

import { useParams } from "next/navigation"
import { OpsAuditList } from "@/components/dashboard/ops/ops-audit-list"
import { OpsEnforcementList } from "@/components/dashboard/ops/ops-enforcement-list"

export default function OpsChannelAuditPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <section className="space-y-10">
      <OpsAuditList channelId={id} />
      <OpsEnforcementList channelId={id} />
    </section>
  )
}
