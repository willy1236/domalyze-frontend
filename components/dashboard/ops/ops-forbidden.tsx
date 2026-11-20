/** 不是 bot owner 時營運頁顯示的內容。 */
export function OpsForbidden() {
  return (
    <div role="alert" className="border border-champagne/30 px-4 py-8 text-center">
      <p className="mb-2">沒有權限</p>
      <p className="text-gray-500 dark:text-gray-400">營運入口只開放給 bot owner。</p>
    </div>
  )
}
