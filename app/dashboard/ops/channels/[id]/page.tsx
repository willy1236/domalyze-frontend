"use client"

import { useParams } from "next/navigation"
import { OpsAuditList } from "@/components/dashboard/ops/ops-audit-list"

export default function OpsChannelAuditPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <section>
      <OpsAuditList channelId={id} />
    </section>
  )
}
