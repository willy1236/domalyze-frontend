# domalyze-frontend

星羽（XingyuBot）的官方網站與伺服器管理後台，正式站為 [xingyu.domalyze.net](https://xingyu.domalyze.net)。

- **官網**：首頁、功能介紹、Twitch 整合說明與公開的使用者頁面
- **管理後台**：以 Discord 登入，管理 Discord 伺服器（抽獎、投票、反應身分組、客服單、語音、警告）與 Twitch 頻道（指令、計時器、事件、審核、轉發等）的設定

資料都來自 XingyuBot 提供的 API，本專案只負責前端。

## 環境需求

- Node.js 22
- pnpm 11（版本記在 `package.json` 的 `packageManager`，可用 `corepack enable` 取得）
- 可連線的 XingyuBot API

## 安裝與設定

```bash
pnpm install
cp .env.example .env
```

`.env` 需要的變數見 `.env.example`，值向維護者取得。

## 執行

```bash
pnpm dev     # 開發模式，http://localhost:3000
pnpm build   # 正式建置
pnpm start   # 啟動建置後的版本
```

本機要登入管理後台時改用 HTTPS 開發伺服器，用 http 會卡在授權頁：

```bash
pnpm exec next dev --experimental-https -p 3001
```

### 部署

`Dockerfile` 以 Next.js standalone 模式建置映像，`docker-compose.yml` 負責建置與啟動，env 檔以 build secret 帶入。正式環境的部署由外部的 Ansible 流程處理，GitHub Actions 只跑 CI。

## 測試

```bash
pnpm test         # Vitest
pnpm type-check   # TypeScript 型別檢查
pnpm lint         # ESLint
```

CI（`.github/workflows/ci.yml`）會跑 type-check、test 與 build。
