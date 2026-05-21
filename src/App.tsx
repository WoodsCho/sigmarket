import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { ChevronUp } from "lucide-react"
import { Header, Hero, Footer } from "./components/sections"
import "./App.css"

// Hero/Header는 첫 화면에 바로 필요 — eager load
// 나머지 섹션은 스크롤 시 로드 — lazy load
const Stats        = lazy(() => import("./components/sections/Stats"))
const Signals      = lazy(() => import("./components/sections/Signals"))
const Indicators   = lazy(() => import("./components/sections/Indicators"))
const Testimonials = lazy(() => import("./components/sections/Testimonials"))
const Pricing      = lazy(() => import("./components/sections/Pricing"))
const Philosophy   = lazy(() => import("./components/sections/Philosophy"))

const SectionFallback = () => <div className="md:h-[100dvh] bg-[var(--theme-bg)]" />

const SECTIONS = [
  { id: "hero",         Component: Hero,         lazy: false },
  { id: "stats",        Component: Stats,        lazy: true  },
  { id: "signals",      Component: Signals,      lazy: true  },
  { id: "indicators",   Component: Indicators,   lazy: true  },
  { id: "testimonials", Component: Testimonials, lazy: true  },
  { id: "pricing",      Component: Pricing,      lazy: true  },
  { id: "philosophy",   Component: Philosophy,   lazy: true  },
  { id: "footer",       Component: Footer,       lazy: true  },
]

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showTop, setShowTop] = useState(false)
  const location = useLocation()

  // hash(#indicators 등)로 돌아올 때 해당 섹션으로 스크롤
  useEffect(() => {
    const hash = location.hash.replace("#", "")
    if (!hash) return
    const target = document.getElementById(hash)
    if (target) {
      // snap container 기준 스크롤
      setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 50)
    }
  }, [location.hash])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => setShowTop(el.scrollTop > el.clientHeight * 0.5)
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <Header />
      <div
        id="snap-container"
        ref={containerRef}
        className="h-[100dvh] overflow-y-scroll md:snap-y md:snap-mandatory bg-[var(--theme-bg)] text-white"
      >
        {SECTIONS.flatMap(({ id, Component, lazy: isLazy }, index) => {
          const sectionEl = (
            <section
              key={id}
              id={id}
              className="md:h-[100dvh] md:snap-start md:overflow-hidden"
            >
              {isLazy ? (
                <Suspense fallback={<SectionFallback />}>
                  <Component />
                </Suspense>
              ) : (
                <Component />
              )}
            </section>
          )
          if (index < SECTIONS.length - 1) {
            return [
              sectionEl,
              <div key={`divider-${id}`} className="md:hidden px-4 py-50">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-gray-400/90 to-transparent" />
              </div>,
            ]
          }
          return [sectionEl]
        })}
      </div>

      {/* Scroll to top */}
      <button
        onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="맨 위로 스크롤"
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-110 hover:shadow-cyan-500/20 ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </>
  )
}

export default App
