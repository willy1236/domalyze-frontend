/** 使用者頭像；沒有頭像（例如沒有 Discord 的析域帳號）時用名稱的第一個字。 */
export function UserAvatar({ src, name, className = "w-8 h-8" }: { src: string | null; name: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={32} height={32} className={`${className} rounded-full shrink-0`} />
  }
  return (
    <span
      aria-hidden
      className={`${className} rounded-full shrink-0 flex items-center justify-center bg-champagne/20 text-champagne font-serif`}
    >
      {Array.from(name)[0] ?? "?"}
    </span>
  )
}
