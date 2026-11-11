"use client"

import { useParams } from "next/navigation"
import { SectionGuard } from "@/components/dashboard/section-guard"
import { PunishForm } from "@/components/dashboard/punish-form"
import { WarningList } from "@/components/dashboard/warning-list"

export default function WarningsPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <SectionGuard section="warnings">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <WarningList guildId={id} headerActions={(reload) => <PunishForm guildId={id} reload={reload} />} />
      </div>
    </SectionGuard>
  )
}
