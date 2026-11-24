import { Button, Input } from "@/components/ui"

const ACTIONS = {
  delete: "刪除訊息",
  timeout: "Timeout",
  ban: "Ban",
} as const

const MAX_STAGES = 5
const MAX_TIMEOUT_SECONDS = 14 * 24 * 60 * 60

export interface ModerationStage {
  action: keyof typeof ACTIONS
  duration: number | null
}

export const FIRST_STAGE: ModerationStage[] = [{ action: "delete", duration: null }]

export function stageProblem(stages: ModerationStage[]): string | null {
  if (stages.length < 1 || stages.length > MAX_STAGES) return "處罰階段必須是 1 到 5 段。"
  for (const [index, stage] of stages.entries()) {
    if (
      stage.action === "timeout"
      && (stage.duration === null || !Number.isInteger(stage.duration)
        || stage.duration < 1 || stage.duration > MAX_TIMEOUT_SECONDS)
    ) {
      return `第 ${index + 1} 段的 timeout 秒數必須是 1 到 ${MAX_TIMEOUT_SECONDS} 的整數。`
    }
  }
  return null
}

interface Props {
  stages: ModerationStage[]
  onChange: (stages: ModerationStage[]) => void
}

export function ModerationStageEditor({ stages, onChange }: Props) {
  function replaceStage(index: number, stage: ModerationStage) {
    onChange(stages.map((current, position) => position === index ? stage : current))
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-medium">處罰階段</legend>
      <ol className="space-y-2">
        {stages.map((stage, index) => (
          <li key={index} className="flex flex-wrap items-end gap-2">
            <label className="min-w-32 flex-1 text-sm">
              <span className="mb-1 block">第 {index + 1} 段動作</span>
              <select
                className="w-full border border-champagne/40 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
                value={stage.action}
                onChange={(event) => {
                  const action = event.target.value as ModerationStage["action"]
                  replaceStage(index, { action, duration: action === "timeout" ? 600 : null })
                }}
              >
                {Object.entries(ACTIONS).map(([action, label]) => (
                  <option key={action} value={action}>{label}</option>
                ))}
              </select>
            </label>
            {stage.action === "timeout" && (
              <label className="w-32 text-sm">
                <span className="mb-1 block">第 {index + 1} 段秒數</span>
                <Input
                  type="number"
                  min={1}
                  max={MAX_TIMEOUT_SECONDS}
                  step={1}
                  required
                  value={stage.duration ?? ""}
                  onInput={(event) => {
                    const duration = event.currentTarget.valueAsNumber
                    replaceStage(index, { action: "timeout", duration: Number.isNaN(duration) ? null : duration })
                  }}
                />
              </label>
            )}
            <Button
              type="button"
              disabled={stages.length === 1}
              aria-label={`移除第 ${index + 1} 段`}
              onClick={() => onChange(stages.filter((_, position) => position !== index))}
            >
              移除
            </Button>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        disabled={stages.length >= MAX_STAGES}
        onClick={() => onChange([...stages, { action: "delete", duration: null }])}
      >
        新增階段
      </Button>
    </fieldset>
  )
}
