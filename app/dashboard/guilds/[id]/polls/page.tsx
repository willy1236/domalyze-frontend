"use client"

import { useParams } from "next/navigation"
import { PollList } from "@/components/dashboard/poll-list"
import { SectionGuard } from "@/components/dashboard/section-guard"

export default function PollsPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <SectionGuard section="polls">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <PollList guildId={id} />
      </div>
    </SectionGuard>
  )
}
