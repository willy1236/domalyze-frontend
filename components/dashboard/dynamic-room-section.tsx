"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui"
import { fetchRooms, formatCreatedAt, type DynamicRoom } from "@/lib/dashboard-dynamic-voice-rooms"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

function Creator({ creator }: { creator: DynamicRoom["creator"] }) {
  if (!creator) return <span className={muted}>已離開的成員</span>
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={creator.avatar_url} alt="" width={20} height={20} className="w-5 h-5 rounded-full shrink-0" />
      <span className="break-all">{creator.name}</span>
    </span>
  )
}

function RoomRow({ room }: { room: DynamicRoom }) {
  return (
    <li className="py-4 flex items-start gap-4">
      <div className="min-w-0 flex-1 grid gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_5rem_7rem] sm:items-center">
        <h3 className="font-serif text-lg leading-snug text-primary dark:text-silver break-words">{room.name}</h3>
        <p className="text-sm">
          <span className={`sm:hidden ${muted}`}>建立者：</span>
          <Creator creator={room.creator} />
        </p>
        <p className="text-sm tabular-nums">
          <span className={`sm:hidden ${muted}`}>人數：</span>
          {room.member_count} 人
        </p>
        <p className="text-sm tabular-nums">
          <span className={`sm:hidden ${muted}`}>建立時間：</span>
          {formatCreatedAt(room.created_at)}
        </p>
      </div>
    </li>
  )
}

/** 動態房間清單：進入頁面時載入，另有手動重新整理，不做即時更新。 */
export function DynamicRoomSection({ guildId }: { guildId: string }) {
  const [rooms, setRooms] = useState<DynamicRoom[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setFailed(false)
      setLoading(true)
      try {
        const res = await fetchRooms(guildId, signal)
        setRooms(res.rooms)
      } catch (e) {
        if (signal?.aborted) return
        console.error("load dynamic rooms failed", e)
        setFailed(true)
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [guildId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  return (
    <section id="rooms" className="scroll-mt-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">
          動態房間 {rooms && <span className="text-base text-gray-600 dark:text-gray-400 tabular-nums">{rooms.length}</span>}
        </h2>
        <Button type="button" size="sm" disabled={loading} onClick={() => void load()}>
          重新整理
        </Button>
      </header>

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入動態房間，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void load()}>
            重試
          </button>
          。
        </p>
      )}
      {rooms === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {rooms &&
        (rooms.length === 0 ? (
          <p className={`py-8 ${muted}`}>目前沒有動態房間。有人進入大廳後，bot 建立的房間會列在這裡。</p>
        ) : (
          <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
            {rooms.map((room) => (
              <RoomRow key={room.id} room={room} />
            ))}
          </ul>
        ))}
    </section>
  )
}
