"use client"

import { type ReactNode, useCallback } from "react"
import Link from "next/link"
import { type PublicProfile, buildBlocks, discordLabel, fetchPublicProfile, hasNoContent } from "@/lib/dashboard-public"
import { useLoad } from "@/lib/use-load"

const mutedClass = "text-gray-500 dark:text-gray-400"

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto w-full max-w-2xl min-w-0">
        <Link
          href="/"
          className="mb-10 text-lg font-serif tracking-widest text-primary uppercase flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/xingyu-mark.svg" alt="" width={28} height={28} className="w-7 h-7 dark:brightness-[1.3]" /> Xingyu
        </Link>
        {children}
      </div>
    </main>
  )
}

/** 找不到：未開啟、代號不存在、已停權都是同一個畫面 */
export function NotFoundView() {
  return (
    <Shell>
      <h1 className="text-2xl font-serif mb-3">找不到這個頁面</h1>
      <p className={mutedClass}>這個網址沒有公開的內容。</p>
    </Shell>
  )
}

export function UnavailableView() {
  return (
    <Shell>
      <h1 className="text-2xl font-serif mb-3">暫時無法顯示</h1>
      <p className={mutedClass}>服務暫時無法使用，請稍後重新整理頁面再試。</p>
    </Shell>
  )
}

/** 公開頁內容：代號，加上被勾選的區塊 */
export function PublicProfileView({ profile }: { profile: PublicProfile }) {
  const blocks = buildBlocks(profile)
  const showNames = profile.sections.includes("discord_names")
  return (
    <Shell>
      <h1 className="text-3xl font-serif mb-8 break-words">{profile.username}</h1>
      {hasNoContent(profile) ? (
        <p className={mutedClass}>沒有公開的內容</p>
      ) : (
        <div className="grid gap-8">
          {showNames && (
            <section className="min-w-0 border-t border-champagne/40 pt-4">
              <h2 className="text-lg font-serif mb-4">Discord</h2>
              <ul className="grid gap-3">
                {profile.discords.map((d) => (
                  <li key={d.label} className="flex items-center gap-3 min-w-0">
                    {d.avatar_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full shrink-0" />
                    )}
                    <span className="min-w-0 truncate">{discordLabel(d)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {blocks.map((b) => (
            <section key={b.key} className="min-w-0 border-t border-champagne/40 pt-4">
              <h2 className="text-lg font-serif mb-4">{b.title}</h2>
              {b.key === "playlists" ? (
                b.playlists.length === 0 ? (
                  <p className={mutedClass}>沒有歌單</p>
                ) : (
                  <div className="grid gap-5">
                    {b.playlists.map((p, i) => (
                      <div key={i} className="min-w-0">
                        <h3 className="font-serif mb-2 break-words">{p.name}</h3>
                        {p.songs.length === 0 ? (
                          <p className={`text-sm ${mutedClass}`}>沒有歌曲</p>
                        ) : (
                          <ol className="list-decimal pl-6 grid gap-1 text-sm">
                            {p.songs.map((s, j) => (
                              <li key={j} className="break-words">
                                <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                                  {s.title}
                                </a>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <ul className="grid gap-3">
                  {b.rows.map((r) => (
                    <li key={r.who} className="grid gap-0.5 min-w-0">
                      <span className={`text-sm ${mutedClass} break-words`}>{r.who}</span>
                      <span className="break-words">{r.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </Shell>
  )
}

/** 載入並顯示公開頁；不需要登入 */
export function PublicProfilePage({ username }: { username: string }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchPublicProfile(username, signal), [username])
  const { data, failed } = useLoad(fetcher)
  if (failed) return <UnavailableView />
  if (!data) return <Shell>{null}</Shell>
  if (data.kind === "not_found") return <NotFoundView />
  if (data.kind === "unavailable") return <UnavailableView />
  return <PublicProfileView profile={data.profile} />
}
