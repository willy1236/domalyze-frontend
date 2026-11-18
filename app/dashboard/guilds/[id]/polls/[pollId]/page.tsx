"use client"

import { useParams } from "next/navigation"
import { PollDetailView } from "@/components/dashboard/poll-detail"
import { SectionGuard } from "@/components/dashboard/section-guard"

export default function PollDetailPage() {
  const { id, pollId } = useParams<{ id: string; pollId: string }>()
  const numericId = /^\d+$/.test(pollId) ? Number(pollId) : null
  return (
    <SectionGuard section="polls">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        {numericId === null ? (
          <p className="py-8 text-gray-600 dark:text-gray-400">找不到這個投票。</p>
        ) : (
          <PollDetailView guildId={id} pollId={numericId} />
        )}
      </div>
    </SectionGuard>
  )
}
