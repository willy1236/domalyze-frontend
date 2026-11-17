import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { SongRow } from "./playlists"

const song = { id: 10, url: "https://x/a", title: "晨跑", duration: 185, source_id: null }
const render = (writable: boolean) =>
  renderToStaticMarkup(<SongRow song={song} index={0} last={false} writable={writable} busy={false} checked={false} onCheck={() => {}} onMove={() => {}} />)

describe("SongRow", () => {
  it("顯示編號、標題連結與長度", () => {
    const out = render(true)
    expect(out).toContain("晨跑")
    expect(out).toContain('href="https://x/a"')
    expect(out).toContain("03:05")
  })

  it("有析域帳號時可勾選與排序", () => {
    const out = render(true)
    expect(out).toContain('type="checkbox"')
    expect(out).toContain("下移 晨跑")
    expect(out).toContain("上移 晨跑")
  })

  it("沒有析域帳號時唯讀，沒有可操作的按鈕", () => {
    const out = render(false)
    expect(out).toContain("晨跑")
    expect(out).not.toContain("checkbox")
    expect(out).not.toContain("<button")
  })

  it("第一首不能上移", () => {
    expect(render(true)).toMatch(/<button[^>]*aria-label="上移 晨跑"[^>]*disabled/)
  })
})
