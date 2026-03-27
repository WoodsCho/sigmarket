import { useState, useEffect } from "react"
import { navItems } from "../../data"

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#050a14]/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center">
            <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-6" />
          </div>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-sm text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#signals"
              className="ml-4 px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
            >
              시작하기
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
