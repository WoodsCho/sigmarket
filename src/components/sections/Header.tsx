import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { navItems } from "../../data"

export default function Header() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#08061a]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-6" />
          </div>

          {/* 데스크탑 네비 */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative">
                <a
                  href={item.href}
                  className="relative px-4 py-2 text-sm text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/5 inline-block"
                >
                  {item.label}
                </a>
              </div>
            ))}
            <a
              href="#signals"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/5 inline-block"
            >
              이용하기
            </a>
          </div>

          {/* 모바일 햄버거 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            aria-label="메뉴 열기"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* 모바일 드로어 */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-80 border-b border-white/[0.06]" : "max-h-0"
        }`}
      >
        <div className="px-6 pb-4 flex flex-col gap-1 bg-[#08061a]/95 backdrop-blur-xl">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#signals"
            onClick={() => setMobileOpen(false)}
            className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            이용하기
          </a>
        </div>
      </div>
    </header>
  )
}
