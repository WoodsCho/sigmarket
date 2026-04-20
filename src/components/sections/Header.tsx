import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Menu, X, Flame, ArrowRight } from "lucide-react"
import { navItems } from "../../data"

/* ─── 카운트다운 훅 ─── */
function useCountdown(targetDate: Date) {
  const calc = () => {
    const diff = Math.max(0, targetDate.getTime() - Date.now())
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1_000),
    }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTime(calc), 1_000)
    return () => clearInterval(id)
  }, [])
  return time
}

/* ─── 프로모 배너 닫기 키 ─── */
const BANNER_KEY = "sigmarket-promo-closed"

export default function Header() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(
    () => !sessionStorage.getItem(BANNER_KEY)
  )

  // 프로모 종료일 — 30일 후 (필요 시 고정 날짜로 교체)
  const endDate = useRef(new Date(Date.now() + 30 * 86_400_000))
  const countdown = useCountdown(endDate.current)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const closeBanner = () => {
    setBannerVisible(false)
    sessionStorage.setItem(BANNER_KEY, "1")
  }

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#08061a]/70 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      {/* ─── 프로모 배너 ─── */}
      {bannerVisible && (
        <div className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 overflow-hidden">
          {/* 파티클 시머 */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.08)_50%,transparent_75%)] bg-[length:200%_100%] animate-[gradient-x_3s_linear_infinite] pointer-events-none" />

          <div className="relative container mx-auto px-4">
            <a
              href="#pricing"
              className="flex items-center justify-center gap-4 py-2 text-sm text-white hover:brightness-110 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline font-medium">기간 한정 특가 — 최대 40% 할인!</span>
                <span className="sm:hidden font-medium">최대 40% 할인!</span>
                <Flame className="w-4 h-4 text-orange-300 animate-pulse" />
              </div>

              {/* 카운트다운 */}
              <div className="flex items-center gap-1 tabular-nums font-mono text-xs">
                <span className="bg-white/15 backdrop-blur-sm rounded px-1.5 py-0.5 font-bold">{pad(countdown.days)}</span>
                <span className="text-white/50">일</span>
                <span className="text-white/40 mx-0.5">:</span>
                <span className="bg-white/15 backdrop-blur-sm rounded px-1.5 py-0.5 font-bold">{pad(countdown.hours)}</span>
                <span className="text-white/50">시간</span>
                <span className="text-white/40 mx-0.5">:</span>
                <span className="bg-white/15 backdrop-blur-sm rounded px-1.5 py-0.5 font-bold">{pad(countdown.minutes)}</span>
                <span className="text-white/50">분</span>
                <span className="text-white/40 mx-0.5">:</span>
                <span className="bg-white/15 backdrop-blur-sm rounded px-1.5 py-0.5 font-bold">{pad(countdown.seconds)}</span>
                <span className="text-white/50">초</span>
              </div>
            </a>

            {/* 닫기 */}
            <button
              onClick={closeBanner}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="배너 닫기"
            >
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>
        </div>
      )}

      {/* ─── 네비게이션 ─── */}
      <div className="w-full px-6 py-4">
        <nav className="flex items-center justify-between w-full">
          {/* 로고 */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-6" />
          </div>

          {/* 데스크탑 네비 + CTA — 오른쪽 정렬 */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-sm text-gray-400 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/5 inline-block"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* 데스크탑 CTA 버튼 */}
          <div className="hidden md:flex items-center gap-3 ml-4">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg"
            >
              Log In
            </button>
            <a
              href="#pricing"
              className="group flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 transition-all duration-300"
            >
              Sign Up
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" />
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
          mobileOpen ? "max-h-96" : "max-h-0"
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
          <div className="border-t border-white/[0.06] mt-2 pt-3 flex flex-col gap-1">
            <button
              onClick={() => { setMobileOpen(false); navigate("/login") }}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-left"
            >
              Log In
            </button>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="mx-4 mt-1 flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-300"
            >
              Sign Up
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
