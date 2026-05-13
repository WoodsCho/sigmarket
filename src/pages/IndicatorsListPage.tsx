import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Header, Footer } from "../components/sections"
import { IndicatorGridSkeleton } from "../components/ui/skeleton"
import { IndicatorCard } from "../components/sections/Indicators"
import { useIndicators } from "../hooks/useIndicators"

export default function IndicatorsListPage() {
  const navigate = useNavigate()
  const { indicators, isLoading } = useIndicators()

  return (
    <div className="min-h-[100dvh] bg-[var(--theme-bg)] text-white relative overflow-x-hidden">
      <Header />

      {/* 배경 글로우 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <section className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-6xl mx-auto">

          {/* 뒤로가기 */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            메인으로 돌아가기
          </button>

          {/* 페이지 제목 */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
              커스텀 보조지표
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-500 text-sm">TradingView 기반 전문 인디케이터 시스템</p>
              {!isLoading && (
                <span className="text-xs text-gray-600">총 {indicators.length}개</span>
              )}
            </div>
          </div>

          {/* 그리드 */}
          {isLoading ? (
            <IndicatorGridSkeleton count={6} />
          ) : indicators.length === 0 ? (
            <div className="text-center py-24 text-gray-500">
              <p className="text-lg">등록된 인디케이터가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {indicators.map((indicator, idx) => (
                <IndicatorCard
                  key={indicator.id || idx}
                  indicator={indicator}
                  idx={idx}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  )
}
