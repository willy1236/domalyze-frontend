import { act, useEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useLoad, type Fetcher, type Load } from "./use-load"

// 讓 act 不警告「不在測試環境」
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

interface Deferred<T> {
  promise: Promise<T>
  resolve: (v: T) => void
  reject: (e: unknown) => void
  signal: AbortSignal
}

/** 每次呼叫 fetcher 都記下一個可手動完成的請求 */
function controllable<T>() {
  const calls: Deferred<T>[] = []
  const make = (): Fetcher<T> => (signal) => {
    let resolve!: (v: T) => void
    let reject!: (e: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    calls.push({ promise, resolve, reject, signal })
    return promise
  }
  return { calls, make }
}

let container: HTMLDivElement
let root: Root
let latest: Load<string>

beforeEach(() => {
  container = document.createElement("div")
  root = createRoot(container)
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  act(() => root.unmount())
  vi.restoreAllMocks()
})

function Probe({
  fetcher,
  keepPrevious,
  onError,
}: {
  fetcher: Fetcher<string> | null
  keepPrevious?: boolean
  onError?: (e: unknown) => void
}) {
  const result = useLoad(fetcher, { keepPrevious, onError })
  useEffect(() => {
    latest = result
  })
  return null
}

function render(props: Parameters<typeof Probe>[0]) {
  act(() => root.render(<Probe {...props} />))
}

async function settle(fn: () => void) {
  await act(async () => {
    fn()
  })
}

describe("useLoad", () => {
  it("載入成功後提供資料", async () => {
    const { calls, make } = controllable<string>()
    render({ fetcher: make() })
    expect(latest).toMatchObject({ data: null, loading: true, failed: false })
    await settle(() => calls[0].resolve("A"))
    expect(latest).toMatchObject({ data: "A", loading: false, failed: false, error: null })
  })

  it("失敗時 failed 與 error，並呼叫 onError", async () => {
    const { calls, make } = controllable<string>()
    const onError = vi.fn()
    render({ fetcher: make(), onError })
    const err = new Error("boom")
    await settle(() => calls[0].reject(err))
    expect(latest).toMatchObject({ data: null, loading: false, failed: true, error: err })
    expect(onError).toHaveBeenCalledWith(err)
  })

  it("fetcher 為 null 時不請求", () => {
    const { calls } = controllable<string>()
    render({ fetcher: null })
    expect(calls).toHaveLength(0)
    expect(latest).toMatchObject({ data: null, loading: false, failed: false })
  })

  it("reload 保留舊資料，完成時 resolve", async () => {
    const { calls, make } = controllable<string>()
    render({ fetcher: make() })
    await settle(() => calls[0].resolve("A"))
    let done = false
    await settle(() => void latest.reload().then(() => (done = true)))
    expect(calls).toHaveLength(2)
    expect(latest).toMatchObject({ data: "A", loading: true })
    expect(done).toBe(false)
    await settle(() => calls[1].resolve("A2"))
    expect(latest).toMatchObject({ data: "A2", loading: false })
    expect(done).toBe(true)
  })

  it("reload 失敗後重試會清掉 failed", async () => {
    const { calls, make } = controllable<string>()
    render({ fetcher: make() })
    await settle(() => calls[0].reject(new Error("x")))
    expect(latest.failed).toBe(true)
    await settle(() => void latest.reload())
    expect(latest).toMatchObject({ failed: false, loading: true })
  })

  it("換 fetcher 時取消舊請求、清掉舊資料，晚回的舊結果不覆蓋", async () => {
    const { calls, make } = controllable<string>()
    const a = make()
    render({ fetcher: a })
    await settle(() => calls[0].resolve("A"))
    render({ fetcher: make() })
    expect(latest).toMatchObject({ data: null, loading: true })

    render({ fetcher: make() })
    expect(calls[1].signal.aborted).toBe(true)
    await settle(() => calls[1].resolve("B"))
    expect(latest).toMatchObject({ data: null, loading: true })
    await settle(() => calls[2].resolve("C"))
    expect(latest).toMatchObject({ data: "C", loading: false })
  })

  it("keepPrevious 時換 fetcher 保留舊資料到新資料回來", async () => {
    const { calls, make } = controllable<string>()
    render({ fetcher: make(), keepPrevious: true })
    await settle(() => calls[0].resolve("A"))
    render({ fetcher: make(), keepPrevious: true })
    expect(latest).toMatchObject({ data: "A", loading: true })
    await settle(() => calls[1].resolve("B"))
    expect(latest).toMatchObject({ data: "B", loading: false })
  })

  it("關閉（null）再開啟會重新載入，不沿用上次的資料", async () => {
    const { calls, make } = controllable<string>()
    const a = make()
    render({ fetcher: a })
    await settle(() => calls[0].resolve("A"))
    render({ fetcher: null })
    expect(latest.data).toBeNull()
    render({ fetcher: a })
    expect(calls).toHaveLength(2)
    expect(latest).toMatchObject({ data: null, loading: true })
  })

  it("setData 直接改資料", async () => {
    const { calls, make } = controllable<string>()
    render({ fetcher: make() })
    await settle(() => calls[0].resolve("A"))
    await settle(() => latest.setData("local"))
    expect(latest.data).toBe("local")
  })
})

