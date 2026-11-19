/** 區塊還沒開放時的空頁面；各區塊完成時整頁替換。 */
export function NotAvailable({ title }: { title: string }) {
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">{title}</h2>
      <p className="border border-champagne/30 px-4 py-8 text-center text-gray-500 dark:text-gray-400">尚未開放</p>
    </section>
  )
}
