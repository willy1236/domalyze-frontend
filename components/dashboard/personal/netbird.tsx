"use client"

import { useCallback, useState } from "react"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import { type PersonalOverview, isLocked } from "@/lib/dashboard-personal"
import { useLoad } from "@/lib/use-load"
import { PersonalSection } from "./personal-section"

const buttonClass =
  "border border-primary/30 dark:border-champagne/30 text-primary dark:text-silver px-3 py-1.5 text-xs tracking-widest uppercase hover:bg-primary hover:text-white dark:hover:bg-champagne dark:hover:text-background-dark transition-colors disabled:opacity-60 disabled:hover:bg-transparent disabled:cursor-not-allowed"
const mutedClass = "text-sm text-gray-500 dark:text-gray-400"

export interface NetbirdPeer {
  name: string
  ip: string | null
  connected: boolean
  last_seen: string | null
  os: string | null
  version: string | null
}

export interface NetbirdState {
  /** 有析域帳號，可以產生安裝指令 */
  writable: boolean
  /** 查不到這個人的綁定資料（身分服務暫時不可用） */
  unavailable: boolean
  bound: boolean
  peers: NetbirdPeer[]
}

export interface NetbirdSetup {
  command: string
  bat: string
}

/** 與 /game netbird 相同的格式：2026-11-17T01:02:03Z → 2026-11-17 01:02:03 */
function formatLastSeen(value: string | null): string {
  return value ? value.replace("T", " ").slice(0, 19) : "未知"
}

function Peer({ peer }: { peer: NetbirdPeer }) {
  return (
    <li className="py-3 border-t border-champagne/15 min-w-0">
      <p className="font-serif break-words">{peer.name}</p>
      <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-sm">
        <dt className="text-gray-500 dark:text-gray-400">IP 位址</dt>
        <dd className="tabular-nums break-all">{peer.ip ?? "未知"}</dd>
        <dt className="text-gray-500 dark:text-gray-400">連線狀態</dt>
        <dd>{peer.connected ? "🟢 在線" : "🔴 離線"}</dd>
        <dt className="text-gray-500 dark:text-gray-400">最後上線</dt>
        <dd className="tabular-nums">{formatLastSeen(peer.last_seen)}</dd>
        <dt className="text-gray-500 dark:text-gray-400">系統</dt>
        <dd className="break-words">
          {peer.os ?? "未知"}（NetBird {peer.version ?? "未知"}）
        </dd>
      </dl>
    </li>
  )
}

function SetupResult({ setup }: { setup: NetbirdSetup }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(setup.command)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([setup.bat], { type: "application/octet-stream" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "netbird_setup.bat"
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="grid gap-3">
      <p className={mutedClass}>請在你的裝置上執行以下指令，或下載腳本直接執行。</p>
      <pre className="border border-champagne/30 p-3 text-sm whitespace-pre-wrap break-all select-all">{setup.command}</pre>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={() => void copy()}>
          {copied ? "已複製" : "複製指令"}
        </button>
        <button type="button" className={buttonClass} onClick={download}>
          下載 .bat
        </button>
      </div>
      <p className={mutedClass}>此金鑰 24 小時內有效且只能使用一次，請勿分享給他人。</p>
    </div>
  )
}

/** NetBird 區塊的內容：節點、產生按鈕與產生結果；資料與動作由外層提供 */
export function NetbirdView({
  state,
  setup,
  busy,
  error,
  onSetup,
}: {
  state: NetbirdState
  setup: NetbirdSetup | null
  busy: boolean
  error: string | null
  onSetup: () => void
}) {
  return (
    <div className="grid gap-4">
      {state.unavailable ? (
        <p className={mutedClass}>暫時無法載入。</p>
      ) : !state.bound ? (
        <p className={mutedClass}>尚未綁定 NetBird。{state.writable && "產生安裝指令並在裝置上執行後即完成綁定。"}</p>
      ) : state.peers.length === 0 ? (
        <p className={mutedClass}>尚未偵測到節點，請先在裝置上執行安裝指令。</p>
      ) : (
        <ul>
          {state.peers.map((p) => (
            <Peer key={`${p.name}-${p.ip}`} peer={p} />
          ))}
        </ul>
      )}
      {state.writable && (
        <div className="grid gap-3">
          <div>
            <button type="button" className={buttonClass} disabled={busy} onClick={onSetup}>
              {busy ? "產生中…" : "產生安裝指令"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          {setup && <SetupResult setup={setup} />}
        </div>
      )}
    </div>
  )
}

function failureMessage(e: unknown): string | null {
  if (e instanceof DashboardApiError) {
    if (e.handled) return null
    if (e.code === "netbird_unavailable") return "NetBird 暫時連不上，請稍後再試。"
  }
  return "產生失敗，請稍後再試。"
}

/** NetBird 區塊：節點資訊與按下才產生的安裝指令；沒有析域帳號時唯讀 */
export function NetbirdSection({ overview }: { overview: PersonalOverview }) {
  const fetcher = useCallback((signal: AbortSignal) => dashboardFetch<NetbirdState>("/dashboard/personal/netbird", {}, { signal }), [])
  const { data, failed, reload } = useLoad(fetcher)
  const [setup, setSetup] = useState<NetbirdSetup | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setBusy(true)
    setError(null)
    try {
      setSetup(await dashboardFetch<NetbirdSetup>("/dashboard/personal/netbird/setup", { method: "POST" }))
      void reload()
    } catch (e) {
      setError(failureMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PersonalSection title="NetBird" locked={isLocked(overview)}>
      {failed ? (
        <p className={mutedClass}>NetBird 暫時連不上，請稍後重新整理頁面再試。</p>
      ) : data ? (
        <NetbirdView state={data} setup={setup} busy={busy} error={error} onSetup={() => void generate()} />
      ) : null}
    </PersonalSection>
  )
}
