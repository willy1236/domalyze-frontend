"use client"

import { useParams } from "next/navigation"
import { SectionGuard } from "@/components/dashboard/section-guard"
import { TicketLobbySection } from "@/components/dashboard/ticket-lobby-section"

export default function TicketsPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <SectionGuard section="tickets">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <TicketLobbySection guildId={id} />
      </div>
    </SectionGuard>
  )
}
