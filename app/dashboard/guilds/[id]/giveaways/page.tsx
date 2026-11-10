"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { GiveawayActions } from "@/components/dashboard/giveaway-actions"
import { GiveawayDetailView } from "@/components/dashboard/giveaway-detail"
import { GiveawayList } from "@/components/dashboard/giveaway-list"
import { SectionGuard } from "@/components/dashboard/section-guard"

export default function GiveawaysPage() {
  const { id } = useParams<{ id: string }>()
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <SectionGuard section="giveaways">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        {selected === null ? (
          <GiveawayList guildId={id} onSelect={setSelected} />
        ) : (
          <GiveawayDetailView
            guildId={id}
            giveawayId={selected}
            onBack={() => setSelected(null)}
            actions={(detail, reload) => <GiveawayActions guildId={id} detail={detail} reload={reload} />}
          />
        )}
      </div>
    </SectionGuard>
  )
}
