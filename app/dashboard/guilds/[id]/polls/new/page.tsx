"use client"

import { useParams } from "next/navigation"
import { PollForm } from "@/components/dashboard/poll-form"
import { SectionGuard } from "@/components/dashboard/section-guard"

export default function NewPollPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <SectionGuard section="polls">
      <div className="max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <PollForm guildId={id} />
      </div>
    </SectionGuard>
  )
}
