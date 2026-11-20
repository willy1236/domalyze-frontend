"use client"

import { useEffect, useRef, useState } from "react"

export interface TrendPoint {
  /** YYYY-MM-DD */
  date: string
  value: number
}

const HEIGHT = 160
const PAD = { top: 12, right: 12, bottom: 24, left: 52 }

const fmt = new Intl.NumberFormat("zh-TW")

function dayMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

/** 單一數列的每日折線圖：滑過顯示當天數值，下方可展開表格。 */
export function TrendChart({ title, points }: { title: string; points: TrendPoint[] }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  const last = points.at(-1)
  const values = points.map((p) => p.value)
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const t0 = points.length > 0 ? dayMs(points[0].date) : 0
  const t1 = last ? dayMs(last.date) : 1
  const plotW = Math.max(width - PAD.left - PAD.right, 1)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (date: string) => PAD.left + (t1 === t0 ? plotW / 2 : ((dayMs(date) - t0) / (t1 - t0)) * plotW)
  const y = (value: number) => PAD.top + (1 - (value - lo) / (hi - lo)) * plotH
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join("")

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const left = e.currentTarget.getBoundingClientRect().left
    const px = e.clientX - left
    let best = 0
    for (let i = 1; i < points.length; i += 1) {
      if (Math.abs(x(points[i].date) - px) < Math.abs(x(points[best].date) - px)) best = i
    }
    setHover(points.length > 0 ? best : null)
  }

  const active = hover === null ? null : points[hover]

  return (
    <figure className="border border-champagne/30 px-4 py-3 space-y-2 min-w-0">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span>{title}</span>
        {last && <span className="text-2xl font-serif tabular-nums">{fmt.format(last.value)}</span>}
      </figcaption>
      {points.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">這段期間沒有紀錄</p>
      ) : (
        <div ref={boxRef} className="relative">
          {width > 0 && (
            <svg
              width={width}
              height={HEIGHT}
              role="img"
              aria-label={`${title}，${points[0].date} 到 ${last?.date}`}
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHover(null)}
              className="block touch-none"
            >
              <g className="text-gray-500 dark:text-gray-400" fill="currentColor" fontSize={11}>
                {[hi, lo].map((v) => (
                  <g key={v}>
                    <line
                      x1={PAD.left}
                      x2={PAD.left + plotW}
                      y1={y(v)}
                      y2={y(v)}
                      className="stroke-gray-300 dark:stroke-gray-700"
                      strokeWidth={1}
                    />
                    <text x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="tabular-nums">
                      {fmt.format(Math.round(v))}
                    </text>
                  </g>
                ))}
                <text x={PAD.left} y={HEIGHT - 6}>
                  {points[0].date}
                </text>
                <text x={PAD.left + plotW} y={HEIGHT - 6} textAnchor="end">
                  {last?.date}
                </text>
              </g>
              <path d={path} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-primary dark:stroke-champagne" />
              {active && (
                <g>
                  <line
                    x1={x(active.date)}
                    x2={x(active.date)}
                    y1={PAD.top}
                    y2={PAD.top + plotH}
                    className="stroke-gray-400 dark:stroke-gray-500"
                    strokeWidth={1}
                  />
                  <circle
                    cx={x(active.date)}
                    cy={y(active.value)}
                    r={4}
                    strokeWidth={2}
                    className="fill-primary dark:fill-champagne stroke-surface-light dark:stroke-surface-dark"
                  />
                </g>
              )}
            </svg>
          )}
          {active && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-champagne/40 bg-surface-light dark:bg-surface-dark px-2 py-1 text-xs whitespace-nowrap shadow-sm"
              style={{ left: Math.min(Math.max(x(active.date), 60), width - 60) }}
            >
              <span className="text-gray-600 dark:text-gray-400">{active.date}</span>{" "}
              <span className="tabular-nums">{fmt.format(active.value)}</span>
            </div>
          )}
        </div>
      )}
      {points.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 dark:text-gray-400">表格</summary>
          <div className="mt-2 max-h-60 overflow-y-auto">
            <table className="w-full text-left tabular-nums">
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.date} className="border-t border-champagne/20">
                    <td className="py-1">{p.date}</td>
                    <td className="py-1 text-right">{fmt.format(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  )
}
