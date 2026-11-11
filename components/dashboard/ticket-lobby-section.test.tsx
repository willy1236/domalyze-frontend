import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TicketLobbyItem, TicketRow } from "./ticket-lobby-section"
import type { TicketItem, TicketLobby } from "@/lib/dashboard-tickets"

const ticket = (over: Partial<TicketItem> = {}): TicketItem => ({
  channel: { id: "50", name: "ticket-0001" },
  jump_url: "https://discord.com/channels/1/50",
  creator: { id: "7", name: "小明" },
  created_at: "2026-11-10T09:05:00Z",
  number: 1,
  status: "open",
  closer: null,
  closed_at: null,
  ...over,
})

const lobby = (over: Partial<TicketLobby> = {}): TicketLobby => ({
  channel: { id: "5", name: "開單", invalid: false },
  jump_url: "https://discord.com/channels/1/5/9",
  message_invalid: false,
  category: { id: "100", name: "客服", invalid: false },
  invalid_reason: null,
  manager_roles: [],
  name_prefix: "ticket",
  one_per_user: true,
  max_open: null,
  ticket_count: 0,
  locked_count: 0,
  permission_issues: [],
  tickets: [],
  ...over,
})

const renderLobby = (l: TicketLobby, actions?: React.ReactNode) =>
  renderToStaticMarkup(<TicketLobbyItem lobby={l} actions={actions} />)

describe("TicketLobbyItem", () => {
  it("預設設定：分類、無管理身分組、前綴、限制，沒有警告", () => {
    const out = renderLobby(lobby())
    for (const t of ["#開單", "客服", "無", "ticket", "每人一張，不限同時開啟上限", "這個大廳目前沒有私人頻道"]) {
      expect(out).toContain(t)
    }
    expect(out).toContain('href="https://discord.com/channels/1/5/9"')
    expect(out).not.toContain("已失效")
    expect(out).not.toContain("bot 缺少")
  })

  it("管理身分組：顯示名稱，已刪除的顯示 ID", () => {
    const out = renderLobby(
      lobby({
        manager_roles: [
          { id: "1", name: "客服人員", invalid: false },
          { id: "2", name: null, invalid: true },
        ],
      }),
    )
    expect(out).toContain("@客服人員")
    expect(out).toContain("身分組 2（已被刪除）")
  })

  it("大廳頻道被刪：標示失效，不給 Discord 連結", () => {
    const out = renderLobby(lobby({ channel: { id: "5", name: null, invalid: true }, invalid_reason: "channel_deleted" }))
    expect(out).toContain("大廳頻道已不存在")
    expect(out).toContain("已失效")
    expect(out).toContain("大廳頻道已被刪除")
    expect(out).not.toContain("在 Discord 開啟")
  })

  it("分類被刪與未設定", () => {
    const deleted = renderLobby(
      lobby({ category: { id: "100", name: null, invalid: true }, invalid_reason: "category_deleted" }),
    )
    expect(deleted).toContain("分類 100（已被刪除）")
    expect(deleted).toContain("重新選分類")
    expect(renderLobby(lobby({ category: { id: null, name: null, invalid: true }, invalid_reason: "category_deleted" }))).toContain(
      "尚未設定",
    )
  })

  it("bot 權限警告列出位置、權限與後果", () => {
    const out = renderLobby(
      lobby({
        permission_issues: [
          { permission: "Manage Channels", target: "category", consequence: "無法建立或刪除私人頻道" },
          { permission: "Embed Links", target: "lobby_channel", consequence: "大廳訊息的 embed 無法顯示" },
        ],
      }),
    )
    expect(out).toContain("私人頻道所在分類的 Manage Channels")
    expect(out).toContain("無法建立或刪除私人頻道")
    expect(out).toContain("大廳頻道的 Embed Links")
  })

  it("私人頻道數量含已鎖定，並渲染列與動作插槽", () => {
    const out = renderToStaticMarkup(
      <TicketLobbyItem
        lobby={lobby({ ticket_count: 2, locked_count: 1, tickets: [ticket()] })}
        actions={<button>編輯大廳</button>}
        ticketActions={() => <button>鎖定</button>}
      />,
    )
    expect(out).toContain("2 個（其中已鎖定 1 個）")
    expect(out).toContain("#ticket-0001")
    expect(out).toContain("編輯大廳")
    expect(out).toContain("鎖定")
  })
})

describe("TicketRow", () => {
  it("開啟中：顯示建立者與建立時間，沒有鎖定資訊", () => {
    const out = renderToStaticMarkup(<TicketRow ticket={ticket()} />)
    expect(out).toContain("開啟中")
    expect(out).toContain("建立者：小明")
    expect(out).not.toContain("鎖定者")
  })

  it("已鎖定：顯示鎖定者與鎖定時間，離開伺服器的只顯示 ID", () => {
    const out = renderToStaticMarkup(
      <TicketRow
        ticket={ticket({
          status: "locked",
          closer: { id: "8", name: null },
          closed_at: "2026-11-10T10:05:00Z",
          creator: { id: "7", name: null },
        })}
      />,
    )
    expect(out).toContain("已鎖定")
    expect(out).toContain("鎖定者：8（已離開伺服器）")
    expect(out).toContain("鎖定於")
    expect(out).toContain("建立者：7（已離開伺服器）")
  })
})
