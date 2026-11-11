"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"

export type Fetcher<T> = (signal: AbortSignal) => Promise<T>

export interface Load<T> {
  /** 目前 fetcher 最近一次成功的結果；重新載入期間保留舊值 */
  data: T | null
  /** 目前這次請求失敗的錯誤；載入中或成功時為 null */
  error: unknown
  failed: boolean
  /** 目前這次請求還沒完成（fetcher 為 null 時為 false） */
  loading: boolean
  /** 用同一個 fetcher 再載入一次，完成（成功或失敗）時 resolve */
  reload: () => Promise<void>
  /** 在本機直接改 data，例如存檔後用伺服器回傳的新值取代 */
  setData: Dispatch<SetStateAction<T | null>>
}

interface Options {
  /** fetcher 換掉時（例如翻頁、換篩選條件）保留舊資料到新資料回來，預設清成 null */
  keepPrevious?: boolean
  /** 請求失敗時呼叫（已取消的請求不會呼叫），用來處理要連動其他狀態的錯誤 */
  onError?: (error: unknown) => void
}

/**
 * 載入資料：fetcher 改變（用 useCallback 依條件建立）或呼叫 reload 時重新請求，
 * 前一個請求會被取消，晚回的舊結果不會覆蓋新的。fetcher 傳 null 表示暫不載入（例如對話框關著）。
 */
export function useLoad<T>(fetcher: Fetcher<T> | null, { keepPrevious = false, onError }: Options = {}): Load<T> {
  const [token, setToken] = useState(0)
  const [data, setData] = useState<T | null>(null)
  const [settled, setSettled] = useState<{ fetcher: Fetcher<T>; token: number; error: unknown } | null>(null)

  // fetcher 換掉時在 render 期間重設（React 建議的「依前一個值調整 state」寫法）
  const [prevFetcher, setPrevFetcher] = useState(() => fetcher)
  if (prevFetcher !== fetcher) {
    setPrevFetcher(() => fetcher)
    setSettled(null)
    if (!keepPrevious) setData(null)
  }

  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })

  // reload 的 promise：記下要等的 token，該次（或更新的）請求結束時 resolve
  const tokenRef = useRef(0)
  const waiters = useRef<{ token: number; resolve: () => void }[]>([])

  useEffect(() => {
    if (!fetcher) return
    const controller = new AbortController()
    const finish = () => {
      waiters.current = waiters.current.filter((w) => {
        if (w.token > token) return true
        w.resolve()
        return false
      })
    }
    fetcher(controller.signal).then(
      (result) => {
        if (controller.signal.aborted) return
        setData(result)
        setSettled({ fetcher, token, error: null })
        finish()
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        console.error("load failed", error)
        setSettled({ fetcher, token, error })
        onErrorRef.current?.(error)
        finish()
      },
    )
    return () => controller.abort()
  }, [fetcher, token])

  const reload = useCallback(
    () =>
      new Promise<void>((resolve) => {
        tokenRef.current += 1
        waiters.current.push({ token: tokenRef.current, resolve })
        setToken(tokenRef.current)
      }),
    [],
  )

  const current = fetcher !== null && settled?.fetcher === fetcher && settled.token === token
  const error = current ? settled.error : null
  return {
    data,
    error,
    failed: current && settled.error !== null,
    loading: fetcher !== null && !current,
    reload,
    setData,
  }
}
