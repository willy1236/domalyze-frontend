import { TWITCH_STEPS } from "@/lib/features-data"

export function TwitchSteps() {
  return (
    <section className="py-32 relative border-b border-silver/20 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 lg:px-12 relative z-10">
        <h2 className="font-serif text-3xl md:text-4xl text-center text-gray-900 dark:text-white mb-16">三步開始</h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {TWITCH_STEPS.map((step, index) => (
            <li key={step.title} className="relative border-t border-primary/30 dark:border-champagne/40 pt-6">
              <span className="font-serif text-primary dark:text-champagne text-sm tracking-[0.25em] block mb-3">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-serif text-lg text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 font-light mt-12">
          停用後設定都會保留，重新啟用即可復原；也可以在設定頁刪除頻道的所有資料。
        </p>
      </div>
    </section>
  )
}
