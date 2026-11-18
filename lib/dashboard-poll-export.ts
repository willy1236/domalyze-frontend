import { dashboardFetch } from "./dashboard-api"

const FORBIDDEN_CHARS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g
const MAX_TITLE_LENGTH = 50

/** `poll-<id>-<標題>.csv`；標題去掉檔名不允許的字元，空白收斂，過長截斷，剩下空白則只留 id */
export function pollExportFilename(id: number, title: string): string {
  const safe = Array.from(title.replace(FORBIDDEN_CHARS, " ").replace(/\s+/g, " ").trim())
    .slice(0, MAX_TITLE_LENGTH)
    .join("")
    .trim()
    .replace(/^\.+|\.+$/g, "")
  return safe ? `poll-${id}-${safe}.csv` : `poll-${id}.csv`
}

const EXPORT_ERRORS: Record<string, string> = {
  results_hidden: "目前看不到這個投票的結果，無法匯出。",
  not_found: "找不到這個投票。",
}

export function exportErrorText(code: string | null): string {
  return (code && EXPORT_ERRORS[code]) || "匯出失敗，請稍後再試。"
}

export function fetchPollExport(guildId: string, id: number): Promise<Blob> {
  return dashboardFetch(
    `/dashboard/guilds/${encodeURIComponent(guildId)}/polls/${id}/export.csv`,
    {},
    { as: "blob" },
  )
}

/** 下載投票結果 CSV；錯誤交給 dashboardFetch 處理（session 過期導向登入等），其餘丟出 DashboardApiError */
export async function downloadPollExport(guildId: string, id: number, title: string): Promise<void> {
  const blob = await fetchPollExport(guildId, id)
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = url
    a.download = pollExportFilename(id, title)
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    // 延後釋放，避免部分瀏覽器在下載開始前就失效
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
