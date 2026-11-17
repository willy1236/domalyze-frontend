"use client"

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Button, Input } from "@/components/ui"
import { type PersonalOverview, isLocked } from "@/lib/dashboard-personal"
import {
  type Playlist,
  type PlaylistList,
  addSongs,
  conflictOf,
  createPlaylist,
  deletePlaylist,
  failureText,
  fetchPlaylist,
  fetchPlaylists,
  formatDuration,
  moveId,
  pruneSelection,
  removeSongs,
  renamePlaylist,
  reorderSongs,
  syncPlaylist,
} from "@/lib/dashboard-playlists"
import { useLoad } from "@/lib/use-load"
import { PersonalSection } from "./personal-section"

const mutedClass = "text-sm text-gray-500 dark:text-gray-400"
const errorClass = "text-sm text-red-700 dark:text-red-300"
const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-md border border-champagne/30 text-champagne text-sm leading-none not-disabled:hover:bg-champagne not-disabled:hover:text-background-dark transition-colors disabled:opacity-40"

function ConfirmDialog({
  open,
  title,
  children,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  children: ReactNode
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const uid = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${uid}-title`}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onCancel()
      }}
      onClose={onCancel}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark text-inherit p-5 backdrop:bg-black/50"
    >
      <h3 id={`${uid}-title`} className="font-serif text-lg text-primary dark:text-silver break-words">
        {title}
      </h3>
      <div className="mt-3 text-sm break-words">{children}</div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="danger" disabled={busy} onClick={onConfirm}>
          確認刪除
        </Button>
        <Button type="button" disabled={busy} onClick={onCancel}>
          取消
        </Button>
      </div>
    </dialog>
  )
}

export function SongRow({
  song,
  index,
  last,
  writable,
  busy,
  checked,
  onCheck,
  onMove,
}: {
  song: Playlist["songs"][number]
  index: number
  last: boolean
  writable: boolean
  busy: boolean
  checked: boolean
  onCheck: (checked: boolean) => void
  onMove: (from: number, to: number) => void
}) {
  return (
    <li
      className="flex items-start gap-2 py-2 border-t border-champagne/15 min-w-0"
      onDragOver={(e) => writable && e.preventDefault()}
      onDrop={(e) => {
        const from = Number(e.dataTransfer.getData("text/plain"))
        if (writable && Number.isInteger(from)) {
          e.preventDefault()
          onMove(from, index)
        }
      }}
    >
      {writable && (
        <input
          type="checkbox"
          aria-label={`選取 ${song.title}`}
          checked={checked}
          disabled={busy}
          onChange={(e) => onCheck(e.target.checked)}
          className="mt-1 size-4 shrink-0 accent-champagne"
        />
      )}
      <span className="w-7 shrink-0 pt-0.5 text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <a href={song.url} target="_blank" rel="noopener noreferrer" className="[overflow-wrap:anywhere] underline-offset-4 hover:underline">
          {song.title}
        </a>
        <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{formatDuration(song.duration)}</p>
      </div>
      {writable && (
        <div className="flex shrink-0 items-center gap-1">
          <span
            draggable={!busy}
            aria-hidden
            title="拖曳排序"
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", String(index))
              e.dataTransfer.effectAllowed = "move"
              const row = e.currentTarget.closest("li")
              if (row) e.dataTransfer.setDragImage(row, 0, 0)
            }}
            className="hidden sm:inline-flex size-8 cursor-grab items-center justify-center text-gray-500 dark:text-gray-400 select-none"
          >
            ⠿
          </span>
          <button type="button" className={iconButtonClass} aria-label={`上移 ${song.title}`} disabled={busy || index === 0} onClick={() => onMove(index, index - 1)}>
            ▲
          </button>
          <button type="button" className={iconButtonClass} aria-label={`下移 ${song.title}`} disabled={busy || last} onClick={() => onMove(index, index + 1)}>
            ▼
          </button>
        </div>
      )}
    </li>
  )
}

/** 一次操作的結果；null 表示這份歌單已不存在（刪除成功） */
type Outcome = { playlist: Playlist; message?: string; messages?: string[] } | null

function PlaylistDetail({
  id,
  writable,
  limits,
  onChanged,
  onGone,
}: {
  id: number
  writable: boolean
  limits: PlaylistList["limits"]
  onChanged: () => void
  onGone: () => void
}) {
  const fetcher = useCallback((signal: AbortSignal) => fetchPlaylist(id, signal), [id])
  const { data: playlist, failed, setData } = useLoad(fetcher)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notices, setNotices] = useState<string[]>([])
  const [conflict, setConflict] = useState(false)
  const [confirm, setConfirm] = useState<"songs" | "playlist" | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [url, setUrl] = useState("")

  // 成功時回整份最新歌單；版本衝突時錯誤帶著最新內容，直接換成最新並提示，不重送
  const run = async (action: (p: Playlist) => Promise<Outcome>, after?: () => void) => {
    if (!playlist) return
    setBusy(true)
    setError(null)
    setNotices([])
    setConflict(false)
    try {
      const result = await action(playlist)
      if (result === null) return onGone()
      setData(result.playlist)
      setNotices(result.messages ?? (result.message ? [result.message] : []))
      after?.()
      onChanged()
    } catch (e) {
      const c = conflictOf(e)
      if (c?.current) {
        setData(c.current)
        setConflict(true)
        onChanged()
      } else if (c) {
        onGone()
      } else {
        setError(failureText(e))
      }
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  if (failed) return <p className={mutedClass}>找不到這份歌單，可能已被刪除。</p>
  if (!playlist) return null

  const picked = pruneSelection(selected, playlist.songs)
  const ids = playlist.songs.map((s) => s.id)
  const move = (from: number, to: number) => {
    const next = moveId(ids, from, to)
    if (next) void run((p) => reorderSongs(p, next))
  }
  const toggle = (songId: number, on: boolean) => {
    const next = new Set(picked)
    if (on) next.add(songId)
    else next.delete(songId)
    setSelected(next)
  }
  const canAdd = playlist.songs.length < limits.songs

  return (
    <div className="grid gap-4 min-w-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3 className="font-serif text-lg break-words min-w-0">
          {playlist.name}
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{playlist.songs.length} 首</span>
        </h3>
        {writable && renaming === null && (
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => setRenaming(playlist.name)}>
              改名
            </Button>
            <Button type="button" size="sm" variant="danger" disabled={busy} onClick={() => setConfirm("playlist")}>
              刪除歌單
            </Button>
          </div>
        )}
      </div>

      {writable && renaming !== null && (
        <form
          className="flex flex-wrap gap-2 min-w-0"
          onSubmit={(e) => {
            e.preventDefault()
            void run(renamePlaylistAction(renaming), () => setRenaming(null))
          }}
        >
          <Input aria-label="歌單名稱" value={renaming} maxLength={limits.name} onChange={(e) => setRenaming(e.target.value)} className="flex-1 basis-40" />
          <Button type="submit" disabled={busy || !renaming.trim()}>
            儲存
          </Button>
          <Button type="button" disabled={busy} onClick={() => setRenaming(null)}>
            取消
          </Button>
        </form>
      )}

      {conflict && (
        <p role="alert" className={errorClass}>
          這份歌單剛被修改過（例如用指令），已顯示最新內容，你的操作沒有套用。
        </p>
      )}
      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}
      {notices.length > 0 && (
        <ul className={mutedClass}>
          {notices.map((n, i) => (
            <li key={i} className="break-words">
              {n}
            </li>
          ))}
        </ul>
      )}

      {writable && (
        <form
          className="flex flex-wrap gap-2 min-w-0"
          onSubmit={(e) => {
            e.preventDefault()
            void run((p) => addSongs(p, url.trim()), () => setUrl(""))
          }}
        >
          <Input
            aria-label="歌曲或歌單網址"
            type="url"
            placeholder="歌曲或歌單網址"
            value={url}
            disabled={busy || !canAdd}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 basis-40"
          />
          <Button type="submit" disabled={busy || !canAdd || !url.trim()}>
            {busy && url ? "加入中…" : "加入"}
          </Button>
        </form>
      )}

      {playlist.sources.length > 0 && (
        <div className="grid gap-2">
          <ul className={mutedClass}>
            {playlist.sources.map((s) => (
              <li key={s.id} className="break-words">
                來源：
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  {s.title ?? s.url}
                </a>
              </li>
            ))}
          </ul>
          {writable && (
            <div>
              <Button type="button" size="sm" disabled={busy} onClick={() => void run((p) => syncPlaylist(p))}>
                同步外部歌單
              </Button>
            </div>
          )}
        </div>
      )}

      {playlist.songs.length === 0 ? (
        <p className={mutedClass}>歌單裡沒有歌曲。</p>
      ) : (
        <div className="min-w-0">
          {writable && (
            <div className="flex flex-wrap items-center gap-3 pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={picked.size === ids.length}
                  disabled={busy}
                  onChange={(e) => setSelected(e.target.checked ? new Set(ids) : new Set())}
                  className="size-4 accent-champagne"
                />
                全選
              </label>
              <Button type="button" size="sm" variant="danger" disabled={busy || picked.size === 0} onClick={() => setConfirm("songs")}>
                刪除所選{picked.size > 0 && `（${picked.size}）`}
              </Button>
            </div>
          )}
          <ul>
            {playlist.songs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                last={i === playlist.songs.length - 1}
                writable={writable}
                busy={busy}
                checked={picked.has(song.id)}
                onCheck={(on) => toggle(song.id, on)}
                onMove={move}
              />
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirm === "songs"}
        title={`刪除 ${picked.size} 首歌？`}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void run((p) => removeSongs(p, [...picked]), () => setSelected(new Set()))}
      >
        所選的歌曲會從歌單「{playlist.name}」移除，無法復原。
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "playlist"}
        title={`刪除歌單「${playlist.name}」？`}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() =>
          void run(async (p) => {
            await deletePlaylist(p)
            return null
          })
        }
      >
        歌單與其中的歌曲、來源都會刪除，無法復原。
      </ConfirmDialog>
    </div>
  )
}

const renamePlaylistAction = (name: string) => (p: Playlist) => renamePlaylist(p, name)

function CreateForm({ limits, count, onCreated }: { limits: PlaylistList["limits"]; count: number; onCreated: (id: number) => void }) {
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const full = count >= limits.playlists

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const { playlist } = await createPlaylist(name)
      setName("")
      onCreated(playlist.id)
    } catch (e) {
      setError(failureText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="新歌單名稱"
          placeholder="新歌單名稱"
          value={name}
          maxLength={limits.name}
          disabled={busy || full}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 basis-40"
        />
        <Button type="submit" disabled={busy || full || !name.trim()}>
          建立
        </Button>
      </div>
      {full && <p className={mutedClass}>歌單數量已達上限 {limits.playlists} 個。</p>}
      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}
    </form>
  )
}

/** 歌單區塊：與 /playlist 指令共用同一份資料；沒有析域帳號時只能看 */
export function PlaylistsSection({ overview }: { overview: PersonalOverview }) {
  const { data, failed, reload } = useLoad(fetchPlaylists)
  const [picked, setPicked] = useState<number | null>(null)

  const selected = data?.playlists.find((p) => p.id === picked) ?? data?.playlists[0] ?? null
  // 沒有析域帳號又沒有舊歌單時，只留鎖定說明
  const hidden = isLocked(overview) && data !== null && data.playlists.length === 0

  return (
    <PersonalSection title="歌單" locked={isLocked(overview)}>
      {failed ? (
        <p className={mutedClass}>歌單暫時無法載入，請稍後重新整理頁面再試。</p>
      ) : data?.unavailable ? (
        <p className={mutedClass}>暫時無法載入。</p>
      ) : data === null || hidden ? null : (
        <div className="grid gap-5 min-w-0">
          {data.playlists.length === 0 ? (
            <p className={mutedClass}>還沒有歌單。</p>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="歌單">
              {data.playlists.map((p) => (
                <li key={p.id} className="min-w-0 max-w-full">
                  <button
                    type="button"
                    aria-pressed={p.id === selected?.id}
                    onClick={() => setPicked(p.id)}
                    className={`max-w-full truncate rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      p.id === selected?.id ? "border-champagne bg-champagne text-background-dark" : "border-champagne/30 hover:border-champagne"
                    }`}
                  >
                    {p.name}
                    <span className="ml-1.5 tabular-nums opacity-70">{p.song_count}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data.writable && (
            <CreateForm
              limits={data.limits}
              count={data.playlists.length}
              onCreated={(id) => {
                setPicked(id)
                void reload()
              }}
            />
          )}
          {selected && (
            <PlaylistDetail
              key={selected.id}
              id={selected.id}
              writable={data.writable}
              limits={data.limits}
              onChanged={() => void reload()}
              onGone={() => {
                setPicked(null)
                void reload()
              }}
            />
          )}
        </div>
      )}
    </PersonalSection>
  )
}
