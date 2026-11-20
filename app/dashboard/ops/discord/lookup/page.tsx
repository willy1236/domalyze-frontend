"use client"

import { Suspense } from "react"
import { OpsLookup } from "@/components/dashboard/ops/ops-lookup"
import { OpsTabs } from "@/components/dashboard/ops/ops-tabs"

export default function OpsLookupPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-serif">營運</h1>
      <OpsTabs />
      {/* useSearchParams 需要 Suspense 邊界 */}
      <Suspense>
        <OpsLookup />
      </Suspense>
    </section>
  )
}
