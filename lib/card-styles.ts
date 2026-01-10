export const cardStyles = {
  base: "glass-card p-8 rounded-3xl text-left group",
  iconBox: {
    simple: "w-12 h-12 bg-[#4A5475]/30 rounded-2xl flex items-center justify-center mb-6 text-[#B8B8E0] group-hover:text-[#E0E0FF] group-hover:bg-[#4A5475]/50 transition-colors",
    detailed: (bgColor: string) => `w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center mb-4`,
  },
  title: "text-xl font-bold text-[#E0E0FF] mb-3 group-hover:moon-glow transition-all",
  description: "text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors mb-4",
  badge: {
    highlight: "bg-[#4A5475]/30 text-[#B8B8E0] border-[#4A5475]/50 text-xs",
    command: "bg-[#2A2D3A]/50 text-[#B8B8E0] border-[#4A5475]/30 font-mono text-xs p-2 justify-start",
  },
  label: "text-sm font-medium text-[#B8B8E0]",
  icon: "w-4 h-4 text-[#B8B8E0]",
};
