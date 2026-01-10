import Link from "next/link";
import { Music, Shield, Wand2, ArrowRight, BookOpen } from "lucide-react";
import BackgroundBlobs from "@/components/background-blobs";
import HomePageHeader from "@/components/homepage-header";
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section";
import { FeatureCard } from "@/components/feature-card";

export default function Home() {
  return (
     <div className="flex flex-col relative overflow-hidden">
      
      {/* 導覽列 Navbar */}
      <HomePageHeader/>

      {/* 英雄區塊 Hero Section */}
      <HeroSection />

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

      <Footer />
    </div>
  );
}

