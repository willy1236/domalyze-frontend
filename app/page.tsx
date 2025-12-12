import Link from "next/link";
import { Music, Shield, Wand2, ArrowRight, BookOpen } from "lucide-react";
import BackgroundBlobs from "@/components/background-blobs";
import HomePageHeader from "@/components/homepage-header";

export default function Home() {
  return (
     <div className="flex flex-col relative overflow-hidden">
      
      {/* 導覽列 Navbar */}
      <HomePageHeader/>

      {/* 英雄區塊 Hero Section */}
      <main className="grow flex flex-col items-center justify-center text-center px-4 relative z-10 py-20">
        
        <BackgroundBlobs />

        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-[#E0E0FF] moon-glow leading-tight tracking-tight">
            寂靜夜空中的<br />
            <span className="text-[#9BA3D6] inline-block mt-2">全能助手</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            簡單、優雅且強大。整合音樂播放、伺服器管理與趣味互動，<br className="hidden md:block" />
            將神秘的氛圍帶入您的 Discord 社群。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="#" className="group bg-[#E0E0FF] text-[#1E212B] px-8 py-3 rounded-full font-bold hover:shadow-[0_0_25px_rgba(224,224,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2">
              立即開始
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#" className="group border border-[#4A5475] text-[#9BA3D6] px-8 py-3 rounded-full font-bold hover:bg-[#4A5475]/20 hover:border-[#9BA3D6] transition-all duration-300 flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              查看文檔
            </Link>
          </div>
        </div>

        {/* 特色功能卡片區 Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full mt-24 px-4">
          <FeatureCard 
            icon={<Music className="w-6 h-6" />}
            title="高音質音樂"
            desc="如同聆聽星空的聲音，支援多種平台，提供無損的聽覺體驗與自訂歌單功能。"
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6" />}
            title="安全守護"
            desc="自動化的過濾系統與權限管理，默默守護社群的秩序，防止惡意騷擾。"
          />
          <FeatureCard 
            icon={<Wand2 className="w-6 h-6" />}
            title="趣味互動"
            desc="內建經濟系統、塔羅占卜與 RPG 小遊戲，增加成員間的連結與活躍度。"
          />
        </div>
      </main>

      {/* 頁腳 Footer */}
      <footer className="py-8 text-center text-gray-600 text-sm border-t border-[#2D3242]/50 mt-12 bg-[#15171E]/50 backdrop-blur-sm">
        <p>&copy; 2025 Project Luna. All rights reserved.</p>
      </footer>
    </div>
  );
}

// 抽取卡片組件以保持程式碼整潔
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-card p-8 rounded-3xl text-left group">
      <div className="w-12 h-12 bg-[#4A5475]/30 rounded-2xl flex items-center justify-center mb-6 text-[#B8B8E0] group-hover:text-[#E0E0FF] group-hover:bg-[#4A5475]/50 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#E0E0FF] mb-3 group-hover:moon-glow transition-all">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
        {desc}
      </p>
    </div>
  );
}

