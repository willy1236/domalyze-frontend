"use client"

import { useParams } from "next/navigation"
import { VoiceRanking } from "@/components/dashboard/personal/voice-ranking"

export default function VoiceRankingPage() {
  const { id } = useParams<{ id: string }>()
  return <VoiceRanking guildId={id} />
}
