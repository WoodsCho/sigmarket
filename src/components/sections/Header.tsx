import { useNavigate } from "react-router-dom"
import { navItems } from "../../data"

export default function Header() {
  const navigate = useNavigate()

  return (
    <header className="bg-transparent">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-6" />
          </div>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative">
                <a
                  href={item.href}
                  className="relative px-4 py-2 text-sm text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/5 inline-block"
                >
                  {item.label}
                </a>
                {item.label === "tradingview" && (
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent whitespace-nowrap">
                    15$ 저렴하게
                  </span>
                )}
              </div>
            ))}
            <div className="ml-4">
              <a
                href="#signals"
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 hover:bg-gray-200 transition-all duration-300 inline-block"
              >
                이용하기
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
