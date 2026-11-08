export default async function GuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <section>
      <h1 className="text-2xl font-serif mb-4">伺服器通知</h1>
      <p className="text-gray-500 dark:text-gray-400 break-all">伺服器 {id} 的通知設定即將推出。</p>
    </section>
  )
}
