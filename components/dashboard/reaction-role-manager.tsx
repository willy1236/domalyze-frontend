"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { consumeDraft } from "@/lib/dashboard-draft"
import {
  REACTION_ROLE_DRAFT_KEY,
  type ReactionRoleFormDraft,
  type ReactionRoleMessage,
} from "@/lib/dashboard-reaction-roles"
import { ReactionRoleDeleteButton } from "./reaction-role-delete-button"
import { ReactionRoleForm } from "./reaction-role-form"
import { ReactionRoleResendButton } from "./reaction-role-resend-button"
import { ReactionRoleSection } from "./reaction-role-section"

interface OpenForm {
  message: Pick<ReactionRoleMessage, "message_id"> | null
  restored?: ReactionRoleFormDraft
}

/** 從 reauth 或 session 過期回來時，還原導向前未送出的表單 */
function restoreForm(): OpenForm | null {
  const draft = consumeDraft<ReactionRoleFormDraft>(REACTION_ROLE_DRAFT_KEY)
  return draft ? { message: null, restored: draft.state } : null
}

const linkButton =
  "underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 反應身分組區塊：一覽加上發新訊息與編輯表單。 */
export function ReactionRoleManager({ guildId }: { guildId: string }) {
  const [form, setForm] = useState<OpenForm | null>(restoreForm)
  // 每次開啟表單遞增，讓同一個位置換成另一則時表單狀態歸零
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
        <ReactionRoleForm
          key={formId}
          guildId={guildId}
          message={form.message}
          restored={form.restored}
          onClose={() => setForm(null)}
          onSaved={() => setListKey((n) => n + 1)}
          onOpenExisting={(messageId) => open({ message: { message_id: messageId } })}
        />
      )}
      <ReactionRoleSection
        key={listKey}
        guildId={guildId}
        headerActions={() => (
          <Button type="button" size="sm" onClick={() => open({ message: null })}>
            新增
          </Button>
        )}
        actions={(message, reload) => (
          <>
            {!message.invalid && !message.channel.invalid && (
              <button type="button" className={linkButton} onClick={() => open({ message })}>
                編輯<span className="sr-only">（{message.channel.name ? `#${message.channel.name}` : "此訊息"}）</span>
              </button>
            )}
            {(message.invalid || message.channel.invalid) && (
              <ReactionRoleResendButton guildId={guildId} message={message} onDone={reload} />
            )}
            <ReactionRoleDeleteButton guildId={guildId} message={message} onDone={reload} />
          </>
        )}
      />
    </div>
  )
}
