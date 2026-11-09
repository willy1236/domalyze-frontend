// components/ui 內部共用的 class 字串。刻意不放進 barrel：只給這幾個元件互相引用，
// 讓同一種外觀（例如 champagne 外框按鈕）在 Button 與 LinkButton 之間只存在一份字串。

/** 按鈕外框的色票與 hover 行為 */
export const variantClasses = {
  outline: "border border-champagne/40 text-champagne hover:bg-champagne hover:text-background-dark",
  danger:
    "border border-red-700/50 dark:border-red-300/50 text-red-700 dark:text-red-300 hover:bg-red-700 hover:text-white",
} as const

/** 按鈕與按鈕式連結共用的字級與轉場 */
export const labelClasses = "text-xs tracking-widest uppercase transition-colors"

export const sizeClasses = {
  md: "px-4 py-2",
  sm: "px-3 py-1.5",
} as const

/** 只有原生按鈕會用到的停用樣式；連結沒有 disabled 狀態，不帶這段 */
export const disabledClasses = "disabled:opacity-60"

/** 表單欄位共用的邊框、圓角、字級與停用樣式；底色與寬度由各欄位元件自行指定 */
export const fieldClasses =
  "min-w-0 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm disabled:opacity-60"
