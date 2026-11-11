"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { consumeDraft } from "@/lib/dashboard-draft"
import { TICKET_DRAFT_KEY, type LobbyFormDraft } from "@/lib/dashboard-tickets"
import { TicketLobbyForm } from "./ticket-lobby-form"
import { TicketLobbyRemoveButton } from "./ticket-lobby-remove-button"
import { TicketLobbySection } from "./ticket-lobby-section"

interface OpenForm {
  lobby: { channel: { id: string } } | null
  restored?: LobbyFormDraft
}

/** 從 reauth 或 session 過期回來時，還原導向前未送出的表單 */
function restoreForm(): OpenForm | null {
  const draft = consumeDraft<LobbyFormDraft>(TICKET_DRAFT_KEY)
  return draft ? { lobby: draft.state.lobbyId ? { channel: { id: draft.state.lobbyId } } : null, restored: draft.state } : null
}

const linkButton =
  "underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 私人頻道區塊：一覽加上新增、編輯與移除大廳。 */
export function TicketLobbyManager({ guildId }: { guildId: string }) {
  const [form, setForm] = useState<OpenForm | null>(restoreForm)
  // 每次開啟表單遞增，讓同一個位置換成另一個大廳時表單狀態歸零
  const [formId, setFormId] = useState(0)
  // 存檔後遞增，讓一覽重新載入
  const [listKey, setListKey] = useState(0)

  const open = (next: OpenForm) => {
    setFormId((n) => n + 1)
    setForm(next)
  }

  return (
    <div className="space-y-14">
      {form && (
        <TicketLobbyForm
          key={formId}
          guildId={guildId}
          lobby={form.lobby}
          restored={form.restored}
          onClose={() => setForm(null)}
          onSaved={() => setListKey((n) => n + 1)}
        />
      )}
      <TicketLobbySection
        key={listKey}
        guildId={guildId}
        headerActions={() => (
          <Button type="button" size="sm" onClick={() => open({ lobby: null })}>
            新增大廳
          </Button>
        )}
        lobbyActions={(lobby, reload) => (
          <>
            <button type="button" className={linkButton} onClick={() => open({ lobby })}>
              編輯<span className="sr-only">（{lobby.channel.name ? `#${lobby.channel.name}` : "此大廳"}）</span>
            </button>
            <TicketLobbyRemoveButton guildId={guildId} lobby={lobby} onDone={reload} />
          </>
        )}
      />
    </div>
  )
}
