"use client"

import { useParams } from "next/navigation"
import { DynamicRoomSection } from "@/components/dashboard/dynamic-room-section"
import { LobbySection } from "@/components/dashboard/lobby-section"

export default function VoicePage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="space-y-14 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <LobbySection guildId={id} />
      <DynamicRoomSection guildId={id} />
    </div>
  )
}
