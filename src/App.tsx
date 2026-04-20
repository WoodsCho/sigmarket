import { useEffect, useState } from "react"
import { ChevronUp } from "lucide-react"
import { Header, Hero, Signals, Indicators, Pricing, Philosophy, Footer } from "./components/sections"
import { useFadeIn } from "./hooks/useFadeIn"
import "./App.css"

function FadeInSection({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useFadeIn(0.1)
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  )
}

function App() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-white overflow-hidden">
      <Header />
      <main>
        <Hero />
        <FadeInSection><Signals /></FadeInSection>
        <FadeInSection><Indicators /></FadeInSection>
        <FadeInSection><Pricing /></FadeInSection>
        <FadeInSection><Philosophy /></FadeInSection>
      </main>
      <Footer />

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="맨 위로 스크롤"
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-110 hover:shadow-cyan-500/20 ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  )
}

export default App
