"use client"

import { useParams } from "next/navigation"
import { SectionGuard } from "@/components/dashboard/section-guard"
import { ReactionRoleManager } from "@/components/dashboard/reaction-role-manager"

export default function ReactionRolesPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <SectionGuard section="reaction_roles">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <ReactionRoleManager guildId={id} />
      </div>
    </SectionGuard>
  )
}
