"use client"

export function ShareInviteForm() {
  return (
    <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto relative">
      <div className="absolute -inset-2 bg-champagne/10 blur-2xl rounded-full z-0"></div>
      <input 
        className="flex-1 bg-background-light/30 dark:bg-background-dark/60 backdrop-blur-xl border border-champagne/30 text-gray-900 dark:text-white px-6 py-4 focus:outline-none focus:border-champagne focus:ring-1 focus:ring-champagne placeholder-gray-500 transition-colors rounded-sm relative z-10" 
        placeholder="https://discord.gg/" 
        required 
        type="url" 
      />
      <button 
        className="bg-surface-light dark:bg-surface-dark border border-champagne/50 text-champagne px-8 py-4 uppercase tracking-[0.2em] text-xs hover:bg-champagne hover:text-background-dark transition-colors whitespace-nowrap rounded-sm relative z-10 shadow-[0_0_15px_rgba(196,208,232,0.1)]" 
        type="submit"
      >
        分享邀請
      </button>
    </form>
  )
}
