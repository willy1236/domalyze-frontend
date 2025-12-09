# --- 階段 1: Builder (負責編譯) ---
# 使用 AS builder 標記此階段
FROM node:20-alpine AS builder

WORKDIR /app

# 為了確保安裝的版本一致，建議使用 npm ci 而非 npm install
# 先複製 package 檔案以利用 Docker Layer 快取
COPY package.json package-lock.json ./
RUN npm ci

# 複製所有程式碼
COPY . .

# [核心修改] 將 .env 複製進去，讓 npm run build 可以讀取 NEXT_PUBLIC_ 變數
# 注意：此檔案只存在於 builder 階段，不會被帶入最終的生產環境映像檔中 (如果是多階段建置)
COPY .env .env

# 開始建置 (這時候 Next.js 會將 NEXT_PUBLIC_ 變數燒錄進靜態檔)
RUN npm run build

# --- 階段 2: Runner (負責執行) ---
# 這是最終會跑起來的輕量級映像檔
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 建立非 root 使用者 (安全性考量)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 只複製必要的檔案，丟棄源碼、快取和 .env 檔
# 注意：我們 *不複製* .env，因為 Server 端的密鑰應該由 docker-compose 在執行時掛載
COPY --from=builder /app/public ./public

# 必須啟用 Next.js 的 Standalone 模式
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切換為非 root 使用者
USER nextjs

EXPOSE 3000
ENV PORT=3000

# 如果不加這行，Next.js 預設只會監聽 localhost (127.0.0.1)，導致外部無法連線
ENV HOSTNAME="0.0.0.0"

# Standalone 模式下，直接用 node 執行 server.js 即可，不需 npm start
# Next.js 的 output: 'standalone' 模式，無論原始碼是 TS 還是 JS，永遠都會生成一個 server.js 檔案 作為啟動入口。
CMD ["node", "server.js"]