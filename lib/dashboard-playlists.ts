// 個人區歌單的資料型別、API 呼叫與純函式。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"

export interface PlaylistSong {
  id: number
  url: string
  title: string
  duration: number | null
  source_id: number | null
}

export interface PlaylistSource {
  id: number
  url: string
  title: string | null
  synced_at: string
}

export interface Playlist {
  id: number
  name: string
  version: number
  songs: PlaylistSong[]
  sources: PlaylistSource[]
}

export interface PlaylistSummary {
  id: number
  name: string
  version: number
  song_count: number
}

export interface PlaylistList {
  /** 有析域帳號，可以修改 */
  writable: boolean
  /** 查不到這個人的歌單（身分服務暫時不可用） */
  unavailable: boolean
  limits: { playlists: number; songs: number; name: number }
  playlists: PlaylistSummary[]
}

const BASE = "/dashboard/personal/playlists"

const send = <T>(path: string, method: string, json?: unknown) => dashboardFetch<T>(`${BASE}${path}`, { method, json })

export const fetchPlaylists = (signal: AbortSignal) => dashboardFetch<PlaylistList>(BASE, {}, { signal })

export const fetchPlaylist = (id: number, signal: AbortSignal) =>
  dashboardFetch<{ playlist: Playlist }>(`${BASE}/${id}`, {}, { signal }).then((r) => r.playlist)

export const createPlaylist = (name: string) => send<{ playlist: Playlist }>("", "POST", { name })

export const renamePlaylist = (p: Playlist, name: string) => send<{ playlist: Playlist }>(`/${p.id}`, "PATCH", { name, version: p.version })

export const deletePlaylist = (p: Playlist) => send<{ ok: true }>(`/${p.id}?version=${p.version}`, "DELETE")

export const addSongs = (p: Playlist, url: string) =>
  send<{ message: string; playlist: Playlist }>(`/${p.id}/songs`, "POST", { url, version: p.version })

export const removeSongs = (p: Playlist, songIds: number[]) =>
  send<{ playlist: Playlist }>(`/${p.id}/songs/remove`, "POST", { song_ids: songIds, version: p.version })

export const reorderSongs = (p: Playlist, songIds: number[]) =>
  send<{ playlist: Playlist }>(`/${p.id}/songs/order`, "PUT", { song_ids: songIds, version: p.version })

export const syncPlaylist = (p: Playlist) => send<{ messages: string[]; playlist: Playlist }>(`/${p.id}/sync`, "POST", { version: p.version })

/** 版本衝突：歌單在打開之後被改過（例如用指令）或已被刪除；current 是最新內容，已刪除時為 null */
export interface PlaylistConflict {
  current: Playlist | null
}

export function conflictOf(err: unknown): PlaylistConflict | null {
  if (!(err instanceof DashboardApiError) || err.code !== "conflict") return null
  return { current: (err.body?.current as Playlist | null | undefined) ?? null }
}

/** 其他錯誤要顯示的文字；已由 wrapper 處理（提示或導向）的回 null */
export function failureText(err: unknown): string | null {
  if (err instanceof DashboardApiError) {
    if (err.handled) return null
    if (err.code === "invalid_playlist" && typeof err.body?.message === "string") return err.body.message
    if (err.code === "not_found") return "找不到這份歌單，可能已被刪除。"
    if (err.code === "domalyze_required") return "連結析域帳號後才能修改歌單。"
    if (err.code === "invalid_request") return "送出的內容不正確，請重新整理後再試。"
  }
  return "操作失敗，請稍後再試。"
}

/** 同 /playlist show 的歌曲長度：mm:ss 或 h:mm:ss；未知為 --:-- */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "--:--"
  const total = Math.max(Math.trunc(seconds), 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** 把 ids 裡第 from 個移到第 to 個的位置；超出範圍或位置不變時回傳 null */
export function moveId(ids: number[], from: number, to: number): number[] | null {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return null
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** 清單換成最新內容後，只保留仍存在的已選歌曲 */
export function pruneSelection(selected: ReadonlySet<number>, songs: PlaylistSong[]): Set<number> {
  const alive = new Set(songs.map((s) => s.id))
  return new Set([...selected].filter((id) => alive.has(id)))
}
