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
              </div>
            ))}
            <a
              href="#signals"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/5 inline-block"
            >
              이용하기
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
