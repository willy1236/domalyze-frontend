"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"
import { Button, Input, Textarea } from "@/components/ui"
import {
  AUTHOR_NAME_MAX,
  charLength,
  CONTENT_MAX,
  DESCRIPTION_MAX,
  FIELDS_MAX,
  FIELD_NAME_MAX,
  FIELD_VALUE_MAX,
  FOOTER_TEXT_MAX,
  TITLE_MAX,
  emptyEmbed,
  hasTimestamp,
  moveItem,
  originalTimestamp,
  setTimestamp,
  type EmbedContent,
  type FieldError,
  type MessageContent,
  type PreviewButton,
} from "@/lib/dashboard-message"
import { LabelWithCount } from "./char-count"
import { MessagePreview } from "./message-preview"

interface Props {
  value: MessageContent
  onChange: (next: MessageContent) => void
  /** validateMessage 或後端 invalid_request 的錯誤；依 path 顯示在對應欄位 */
  errors: FieldError[]
  /** 只給預覽用的按鈕列 */
  buttons?: PreviewButton[]
}

const labelClass = "block text-sm text-gray-600 dark:text-gray-400 mb-1"

const blankToNull = (v: string): string | null => (v === "" ? null : v)

function Field({
  label,
  path,
  errors,
  count,
  children,
}: {
  label: string
  path: string
  errors: FieldError[]
  /** 有字數上限的欄位：目前內容與上限，標籤右側即時顯示「目前／上限」 */
  count?: { value: string | null | undefined; max: number }
  children: ReactNode
}) {
  const mine = errors.filter((e) => e.path === path)
  return (
    <div>
      <label className={labelClass}>
        {count ? (
          <LabelWithCount used={charLength(count.value)} max={count.max}>
            {label}
          </LabelWithCount>
        ) : (
          <span className="block">{label}</span>
        )}
        {children}
      </label>
      {mine.map((e, i) => (
        <p key={i} role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">
          {e.reason}
        </p>
      ))}
    </div>
  )
}

function hexOf(color: number | null): string {
  return `#${(color ?? 0).toString(16).padStart(6, "0")}`
}

/** 文字加 embed 的受控編輯器，右側（窄螢幕在下方）即時預覽。 */
export function MessageEditor({ value, onChange, errors, buttons }: Props) {
  const embed = value.embed ?? emptyEmbed()
  const headingId = useId()
  // 取消再重新勾選時，還原訊息原本的時間戳而不是改成當下時間
  const savedTimestamp = useRef<string | null>(originalTimestamp(value.embed))
  // value 之後才帶進讀回的內容時也要記下原值；取消勾選後 value 不再有時間戳，ref 保留最後一個原值
  const currentOriginal = originalTimestamp(value.embed)
  useEffect(() => {
    if (currentOriginal) savedTimestamp.current = currentOriginal
  }, [currentOriginal])
  const mine = (path: string) => errors.filter((e) => e.path === path)

  const setEmbed = (patch: Partial<EmbedContent>) => onChange({ ...value, embed: { ...embed, ...patch } })
  const setFields = (fields: EmbedContent["fields"]) => setEmbed({ fields })

  const author = embed.author ?? { name: null, url: null, icon_url: null }
  const footer = embed.footer ?? { text: null, icon_url: null }

  return (
    <div className="grid gap-6 lg:grid-cols-2" aria-labelledby={headingId}>
      <div className="min-w-0 space-y-4">
        <h3 id={headingId} className="sr-only">
          訊息內容
        </h3>
        <Field label="文字" path="content" errors={errors} count={{ value: value.content, max: CONTENT_MAX }}>
          <Textarea rows={3} value={value.content ?? ""} onChange={(e) => onChange({ ...value, content: blankToNull(e.target.value) })} />
        </Field>

        <fieldset className="space-y-3 rounded-md border border-gray-300 dark:border-gray-600 p-3">
          <legend className="px-1 text-sm font-semibold">Embed</legend>
          <Field label="標題" path="embed.title" errors={errors} count={{ value: embed.title, max: TITLE_MAX }}>
            <Input className="w-full" value={embed.title ?? ""} onChange={(e) => setEmbed({ title: blankToNull(e.target.value) })} />
          </Field>
          <Field label="標題連結" path="embed.url" errors={errors}>
            <Input className="w-full" inputMode="url" value={embed.url ?? ""} onChange={(e) => setEmbed({ url: blankToNull(e.target.value) })} />
          </Field>
          <Field label="說明" path="embed.description" errors={errors} count={{ value: embed.description, max: DESCRIPTION_MAX }}>
            <Textarea rows={4} value={embed.description ?? ""} onChange={(e) => setEmbed({ description: blankToNull(e.target.value) })} />
          </Field>
          <Field label="顏色" path="embed.color" errors={errors}>
            <span className="flex items-center gap-2">
              <input
                type="color"
                aria-label="顏色"
                value={hexOf(embed.color)}
                onChange={(e) => setEmbed({ color: parseInt(e.target.value.slice(1), 16) })}
              />
              <Button type="button" size="sm" disabled={embed.color === null} onClick={() => setEmbed({ color: null })}>
                清除顏色
              </Button>
            </span>
          </Field>

          <Field label="作者名稱" path="embed.author.name" errors={errors} count={{ value: author.name, max: AUTHOR_NAME_MAX }}>
            <Input className="w-full" value={author.name ?? ""} onChange={(e) => setEmbed({ author: { ...author, name: blankToNull(e.target.value) } })} />
          </Field>
          <Field label="作者連結" path="embed.author.url" errors={errors}>
            <Input className="w-full" inputMode="url" value={author.url ?? ""} onChange={(e) => setEmbed({ author: { ...author, url: blankToNull(e.target.value) } })} />
          </Field>
          <Field label="作者圖示網址" path="embed.author.icon_url" errors={errors}>
            <Input className="w-full" inputMode="url" value={author.icon_url ?? ""} onChange={(e) => setEmbed({ author: { ...author, icon_url: blankToNull(e.target.value) } })} />
          </Field>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Fields（{embed.fields.length}／{FIELDS_MAX}）</p>
            {mine("embed.fields").map((e, i) => (
              <p key={i} role="alert" className="text-sm text-red-700 dark:text-red-300">
                {e.reason}
              </p>
            ))}
            {embed.fields.map((f, i) => (
              <div key={i} className="space-y-2 rounded-md border border-gray-300 dark:border-gray-600 p-2">
                <Field label="名稱" path={`embed.fields.${i}.name`} errors={errors} count={{ value: f.name, max: FIELD_NAME_MAX }}>
                  <Input
                    className="w-full"
                    value={f.name}
                    onChange={(e) => setFields(embed.fields.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                </Field>
                <Field label="內容" path={`embed.fields.${i}.value`} errors={errors} count={{ value: f.value, max: FIELD_VALUE_MAX }}>
                  <Textarea
                    rows={2}
                    value={f.value}
                    onChange={(e) => setFields(embed.fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                  />
                </Field>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={f.inline}
                      onChange={(e) => setFields(embed.fields.map((x, j) => (j === i ? { ...x, inline: e.target.checked } : x)))}
                    />
                    與前一個並排
                  </label>
                  <Button type="button" size="sm" disabled={i === 0} onClick={() => setFields(moveItem(embed.fields, i, -1))}>
                    上移
                  </Button>
                  <Button type="button" size="sm" disabled={i === embed.fields.length - 1} onClick={() => setFields(moveItem(embed.fields, i, 1))}>
                    下移
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => setFields(embed.fields.filter((_, j) => j !== i))}>
                    刪除
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              disabled={embed.fields.length >= FIELDS_MAX}
              onClick={() => setFields([...embed.fields, { name: "", value: "", inline: false }])}
            >
              新增 field
            </Button>
          </div>

          <Field label="圖片網址" path="embed.image_url" errors={errors}>
            <Input className="w-full" inputMode="url" value={embed.image_url ?? ""} onChange={(e) => setEmbed({ image_url: blankToNull(e.target.value) })} />
          </Field>
          <Field label="縮圖網址" path="embed.thumbnail_url" errors={errors}>
            <Input className="w-full" inputMode="url" value={embed.thumbnail_url ?? ""} onChange={(e) => setEmbed({ thumbnail_url: blankToNull(e.target.value) })} />
          </Field>
          <Field label="頁尾文字" path="embed.footer.text" errors={errors} count={{ value: footer.text, max: FOOTER_TEXT_MAX }}>
            <Input className="w-full" value={footer.text ?? ""} onChange={(e) => setEmbed({ footer: { ...footer, text: blankToNull(e.target.value) } })} />
          </Field>
          <Field label="頁尾圖示網址" path="embed.footer.icon_url" errors={errors}>
            <Input className="w-full" inputMode="url" value={footer.icon_url ?? ""} onChange={(e) => setEmbed({ footer: { ...footer, icon_url: blankToNull(e.target.value) } })} />
          </Field>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasTimestamp(value.embed)}
                onChange={(e) => onChange({ ...value, embed: setTimestamp(embed, e.target.checked, savedTimestamp.current) })}
              />
              顯示時間戳
            </label>
            {mine("embed.extra.timestamp").map((e, i) => (
              <p key={i} role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">
                {e.reason}
              </p>
            ))}
          </div>
          {mine("embed").map((e, i) => (
            <p key={i} role="alert" className="text-sm text-red-700 dark:text-red-300">
              {e.reason}
            </p>
          ))}
        </fieldset>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">預覽（近似 Discord 的外觀）</p>
        <MessagePreview value={value} buttons={buttons} />
      </div>
    </div>
  )
}
