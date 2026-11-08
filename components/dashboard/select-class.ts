// 原生下拉選單的彈出層不吃 bg-transparent，會變成白底配淺色字；select 與 option 都明確指定底色。
export const selectClass =
  "w-full min-w-0 rounded-md border border-gray-300 dark:border-gray-600 bg-background-light dark:bg-background-dark [&>option]:bg-background-light dark:[&>option]:bg-background-dark px-3 py-2 text-sm disabled:opacity-60"
