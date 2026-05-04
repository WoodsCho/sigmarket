import { useEffect, useRef, useState } from "react"
import { ChevronUp } from "lucide-react"
import { Header, Hero, Stats, Signals, Indicators, Testimonials, Pricing, Philosophy, Footer } from "./components/sections"
import "./App.css"

const SECTIONS = [
  { id: "hero",         Component: Hero         },
  { id: "stats",        Component: Stats        },
  { id: "signals",      Component: Signals      },
  { id: "indicators",   Component: Indicators   },
  { id: "testimonials", Component: Testimonials },
  { id: "pricing",      Component: Pricing      },
  { id: "philosophy",   Component: Philosophy   },
  { id: "footer",       Component: Footer       },
]

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showTop, setShowTop] = useState(false)

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
        className="h-screen overflow-y-scroll snap-y snap-mandatory bg-[var(--theme-bg)] text-white"
      >
        {SECTIONS.map(({ id, Component }) => (
          <section
            key={id}
            id={id}
            className="h-screen snap-start overflow-hidden"
          >
            <Component />
          </section>
        ))}
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
