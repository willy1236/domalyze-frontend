export function StatsSection() {
  const stats = [
    { value: "50,000+", label: "活躍伺服器" },
    { value: "5M+", label: "服務用戶" },
    { value: "99.9%", label: "運行時間" },
    { value: "24/7", label: "技術支援" },
  ]

  return (
    <section id="stats" className="container mx-auto px-4 py-20">
      <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border border-primary/20 p-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
