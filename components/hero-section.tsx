import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import BackgroundBlobs from "@/components/background-blobs"

export function HeroSection() {
  return (
    <main className="grow flex flex-col items-center justify-center text-center px-4 relative z-10 py-20">
      <BackgroundBlobs />

      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold text-[#E0E0FF] moon-glow leading-tight tracking-tight">
          寂靜夜空中的
          <br />
          <span className="text-[#9BA3D6] inline-block mt-2">全能助手</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
          簡單、優雅且強大。整合音樂播放、伺服器管理與趣味互動，
          <br className="hidden md:block" />
          將神秘的氛圍帶入您的 Discord 社群。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="#"
            className="group bg-[#E0E0FF] text-[#1E212B] px-8 py-3 rounded-full font-bold hover:shadow-[0_0_25px_rgba(224,224,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            立即開始
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#"
            className="group border border-[#4A5475] text-[#9BA3D6] px-8 py-3 rounded-full font-bold hover:bg-[#4A5475]/20 hover:border-[#9BA3D6] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            查看文檔
          </Link>
        </div>
      </div>
    </main>
  )
}
