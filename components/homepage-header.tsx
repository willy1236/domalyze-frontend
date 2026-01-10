import { Button } from "@/components/ui/button"
import { Bot, Moon } from "lucide-react"
import Link from "next/link"

const navbar_links = [
  { name: '功能特色', href: '/features' },
  { name: '支援伺服器', href: '#' },
];

export default function HomePageHeader() {
  return (
    <nav className="w-full py-6 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto z-50">
      <Link href="/" className="flex items-center gap-3 group cursor-pointer">
        <div className="relative">
          <Moon className="w-8 h-8 text-[#E0E0FF] fill-[#E0E0FF]/20 group-hover:fill-[#E0E0FF] transition-all duration-500" />
          <div className="absolute inset-0 bg-[#E0E0FF] blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
        </div>
        <span className="text-xl font-bold tracking-[0.2em] text-[#E0E0FF]">Xingyu</span>
      </Link>
      
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
  )
}
