"use client"

import { useParams } from "next/navigation"
import { AutoTimeoutForm } from "@/components/dashboard/auto-timeout-form"
import { SectionGuard } from "@/components/dashboard/section-guard"
import { autoTimeoutValues } from "@/lib/dashboard-settings"
import { SettingsSection } from "@/components/dashboard/settings-section"

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <SectionGuard section="settings">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <SettingsSection
          guildId={id}
          extra={(settings, update) => (
            <AutoTimeoutForm key={JSON.stringify(autoTimeoutValues(settings))} guildId={id} settings={settings} onSaved={update} />
          )}
        />
      </div>
    </SectionGuard>
  )
}
