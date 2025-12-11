import Link from "next/link";
import { Music, Shield, Wand2, Moon, ArrowRight, BookOpen } from "lucide-react";
import BackgroundBlobs from "@/components/background-blobs";

const navbar_links = [
  { name: '功能特色', href: '/features' },
  { name: '支援伺服器', href: '#' },
];

export default function Home() {
  return (
     <div className="flex flex-col relative overflow-hidden">
      
      {/* 導覽列 Navbar */}
      <nav className="w-full py-6 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <Moon className="w-8 h-8 text-[#E0E0FF] fill-[#E0E0FF]/20 group-hover:fill-[#E0E0FF] transition-all duration-500" />
            <div className="absolute inset-0 bg-[#E0E0FF] blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
          </div>
          <span className="text-xl font-bold tracking-[0.2em] text-[#E0E0FF]">LUNA</span>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          {navbar_links.map((item) => (
            <Link key={item.name} href={item.href} className="hover:text-[#E0E0FF] hover:drop-shadow-[0_0_8px_rgba(224,224,255,0.5)] transition-all">
              {item.name}
            </Link>
          ))}
        </div>

        <button className="bg-[#4A5475] hover:bg-[#9BA3D6] hover:text-[#1E212B] text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-lg shadow-[#4A5475]/20 hover:shadow-[#9BA3D6]/40 hover:-translate-y-0.5">
          邀請機器人
        </button>
      </nav>

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

