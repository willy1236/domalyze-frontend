import type { ReactNode } from "react"
import { Button } from "@/components/ui"
import { WarnIcon } from "./icons"

export type ConflictValues = Record<string, string | null>

const FIELD_LABELS: Record<string, string> = {
  channel_id: "頻道",
  voice_time_counter: "語音時數統計",
  role_id: "身分組",
  message: "自訂文字",
  template: "名稱模板",
  content: "訊息內容",
  buttons: "按鈕",
}

interface Props {
  /** 資料庫目前的值；null 表示這筆已被刪除 */
  current: ConflictValues | null
  /** 使用者輸入的值 */
  mine: ConflictValues
  /** 把欄位值顯示成人看得懂的字（例如頻道 ID → 名稱）；預設直接顯示原值，空值顯示「無」 */
  format?: (field: string, value: string | null) => ReactNode
  /** 以我的內容覆蓋：呼叫端用 current 當新的原始值再送一次 */
  onOverwrite: (current: ConflictValues) => void
  /** 已刪除時的「重新新增」；怎麼新增由呼叫端決定 */
  onRecreate?: () => void
  busy?: boolean
  /** 衝突提示裡的主詞，預設「這筆通知」 */
  subject?: string
}

const defaultFormat = (_field: string, value: string | null): ReactNode => (value === null || value === "" ? "無" : value)

function Column({
  title,
  values,
  format,
}: {
  title: string
  values: ConflictValues
  format: NonNullable<Props["format"]>
}) {
  return (
    <div className="min-w-0 rounded-md bg-primary/5 dark:bg-champagne/5 px-3 py-2">
      <h4 className="text-xs tracking-widest uppercase text-gray-600 dark:text-gray-400">{title}</h4>
      <dl className="mt-2 space-y-1 text-sm">
        {Object.entries(values).map(([field, value]) => (
          <div key={field}>
            <dt className="text-gray-600 dark:text-gray-400">{FIELD_LABELS[field] ?? field}</dt>
            <dd className="break-words whitespace-pre-wrap">{format(field, value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** 儲存時發現資料已被別人改過或刪除：並排顯示最新版本與使用者的輸入。 */
export function ConflictNotice({
  current,
  mine,
  format = defaultFormat,
  onOverwrite,
  onRecreate,
  busy,
  subject = "這筆通知",
}: Props) {
  const deleted = current === null
  return (
    <div role="alert" className="rounded-md border border-red-700/40 dark:border-red-300/40 p-4">
      <p className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
        <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
        <span>{deleted ? `${subject}已在你編輯期間被刪除。` : `${subject}已在你編輯期間被別人修改。`}</span>
      </p>
      <div className={`mt-3 grid gap-3 ${deleted ? "" : "sm:grid-cols-2"}`}>
        {current && <Column title="最新版本" values={current} format={format} />}
        <Column title="你的輸入" values={mine} format={format} />
      </div>
      <Button
        type="button"
        disabled={busy}
        onClick={() => (current ? onOverwrite(current) : onRecreate?.())}
        className="mt-4"
      >
        {deleted ? "重新新增" : "以我的內容覆蓋"}
      </Button>
    </div>
  )
}
