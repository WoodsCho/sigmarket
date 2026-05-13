import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useIndicators } from "../hooks/useIndicators"
import { Header, Footer } from "../components/sections"
import StrategyChart from "../components/StrategyChart"
import ReactMarkdown from "react-markdown"

export default function IndicatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { indicators, isLoading } = useIndicators()

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--theme-bg)] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  const idx = Number(id)
  const indicator = indicators[idx]

  if (!indicator) {
    return (
      <div className="min-h-[100dvh] bg-[var(--theme-bg)] text-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-gray-400 text-lg mb-4">인디케이터를 찾을 수 없습니다.</p>
          <button onClick={() => navigate("/#indicators")} className="flex items-center gap-2 text-cyan-500 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="h-4 w-4" /> 메인으로 돌아가기
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--theme-bg)] text-white relative overflow-x-hidden">
      <Header />

      {/* 배경 글로우 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-900/20 blur-[150px] rounded-full pointer-events-none z-0" />

      <section className="relative z-10 container mx-auto px-6 pt-36 pb-20">
        <div className="max-w-6xl mx-auto">

          {/* 뒤로가기 */}
          <button
            onClick={() => navigate("/indicators")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-10"
          >
            <ArrowLeft className="h-4 w-4" />
            All Sigma Setups
          </button>

          {/* ═══ 히어로 헤더 ═══ */}
          <header className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 pb-2">
              {indicator.name}
            </h1>
            {indicator.subtitle && (
              <p className="text-gray-400 text-lg mb-6">{indicator.subtitle}</p>
            )}
            {indicator.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                {indicator.tags.map((tag, i) => (
                  <span key={i} className="px-4 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 text-sm font-medium text-gray-300 shadow-sm backdrop-blur-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* ═══ 차트 영역 ═══ */}
          <div className="mb-20">
            <StrategyChart fixedStrategyId={indicator.strategyId || "sigma-box"} />
          </div>

          {/* ═══ 마크다운 콘텐츠 ═══ */}
          {indicator.content && (
            <div className="flex justify-center">
              <div className="md-content w-full md:w-2/3">
                <ReactMarkdown>{indicator.content}</ReactMarkdown>
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  )
}

