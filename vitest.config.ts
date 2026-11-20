import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // .orca/worktrees 底下是其他分支的 worktree，掃進來會重複跑、跑到別的分支的測試
    exclude: ["node_modules/**", ".next/**", ".orca/**"],
  },
})
