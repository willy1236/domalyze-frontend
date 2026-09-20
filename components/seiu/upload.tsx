"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** 虛線拖放區。 */
export function SeiuDropzone({
  title = "把圖片拖進來",
  hint,
  onPick,
  className,
}: {
  title?: ReactNode
  hint?: ReactNode
  onPick?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-blob-lg border-2 border-dashed border-seiu-dash bg-seiu-field p-[34px_24px] text-center",
        className
      )}
    >
      <div className="text-[30px] text-seiu-label">✦</div>
      <div className="text-base">{title}</div>
      <div className="text-sm font-light text-seiu-muted">
        {hint ?? (
          <>
            或者{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPick?.()
              }}
            >
              選擇檔案
            </a>
            　PNG／JPG，單檔 10MB 以內
          </>
        )}
      </div>
    </div>
  )
}

/** 上傳中的單一檔案列：縮圖、檔名、百分比、細進度條。 */
export function SeiuUploadRow({
  name,
  progress,
  thumbnail,
  onCancel,
  className,
}: {
  name: string
  progress: number
  thumbnail?: ReactNode
  onCancel?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-blob bg-seiu-field2 p-[14px_18px]",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px_12px_12px_4px] bg-[repeating-linear-gradient(45deg,var(--seiu-lav)_0_5px,var(--seiu-field)_5px_10px)]">
        {thumbnail}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex justify-between gap-2.5 text-sm">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {name}
          </span>
          <span className="shrink-0 text-seiu-muted">{progress}%</span>
        </div>
        <div className="seiu-glass h-1.5 overflow-hidden rounded-full border-0">
          <div
            className="h-full rounded-full bg-seiu-accent"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span
        role="button"
        tabIndex={0}
        aria-label="取消上傳"
        onClick={onCancel}
        onKeyDown={(e) => e.key === "Enter" && onCancel?.()}
        className="cursor-pointer text-[15px] text-seiu-muted"
      >
        ×
      </span>
    </div>
  )
}
