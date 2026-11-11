"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui"
import { isUserId, searchMembers, type MemberSearchResult } from "@/lib/dashboard-warnings"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"
const optionClass = `w-full px-3 py-2 text-left text-sm hover:bg-primary/5 dark:hover:bg-champagne/10 disabled:opacity-50 disabled:hover:bg-transparent ${linkClass}`

export interface PickedMember {
  id: string
  label: string
}

interface MemberPickerProps {
  guildId: string
  /** 輸入框的 aria-label */
  label: string
  onPick: (m: PickedMember) => void
  /** 純數字的 ID 也可以直接使用（對象不在伺服器時仍可操作或查舊紀錄）；預設允許 */
  allowId?: boolean
  /** 機器人的選項不可選 */
  disableBots?: boolean
}

/** 以名稱或 ID 搜尋伺服器成員。 */
export function MemberPicker({ guildId, label, onPick, allowId = true, disableBots = false }: MemberPickerProps) {
  const [text, setText] = useState("")
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const query = text.trim()

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchMembers(guildId, query, controller.signal)
        .then(setResults)
        .catch((e: unknown) => {
          if (!controller.signal.aborted) console.error("member search failed", e)
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [guildId, query])

  const pick = (m: PickedMember) => {
    onPick(m)
    setText("")
    setResults([])
  }
  const shown = query ? results : []

  return (
    <div className="relative min-w-0 flex-1 basis-56">
      <Input
        type="search"
        aria-label={label}
        placeholder={allowId ? "輸入成員名稱或 ID" : "輸入成員名稱"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {query && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark shadow-lg">
          {shown.map((m) => {
            const blocked = disableBots && m.bot
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={blocked}
                  className={optionClass}
                  onClick={() => pick({ id: m.id, label: m.name })}
                >
                  {m.name}
                  <span className={`ml-2 ${muted}`}>@{m.username}</span>
                  {blocked && <span className={`ml-2 ${muted}`}>（機器人）</span>}
                </button>
              </li>
            )
          })}
          {allowId && isUserId(query) && !shown.some((m) => m.id === query) && (
            <li>
              <button type="button" className={optionClass} onClick={() => pick({ id: query, label: query })}>
                使用 ID {query}
              </button>
            </li>
          )}
          {shown.length === 0 && !(allowId && isUserId(query)) && <li className={`px-3 py-2 text-sm ${muted}`}>找不到成員</li>}
        </ul>
      )}
    </div>
  )
}
