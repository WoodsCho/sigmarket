import { Link } from "react-router-dom"
import { ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { useIndicators } from "../../hooks/useIndicators"
import type { Indicator } from "../../types"

export default function Indicators() {
  const { indicators, isLoading, isLive } = useIndicators()

  return (
    <section id="indicators" className="relative py-24">
      {/* Section bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a081e] to-transparent" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.06)_0%,_transparent_70%)]" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-purple-400 font-medium mb-3 uppercase tracking-wider">Custom Indicators</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              커스텀 <span className="text-gradient">보조지표</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              TradingView 기반 전문 인디케이터 시스템
            </p>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 mt-4 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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
      </div>
    </section>
  )
}

/* ─── 요약 카드 ─── */
function IndicatorCard({ indicator, idx }: { indicator: Indicator; idx: number }) {
  return (
    <Link to={`/indicators/${idx}`} className="flex h-full">
      <Card className="glass-card glass-card-hover border-0 rounded-2xl transition-all duration-500 group cursor-pointer overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/5 flex flex-col h-full w-full">

        {/* 차트 이미지 / 미리보기 영역 */}
        <div className="relative h-72 bg-gradient-to-br from-[#0a1020] to-[#0d0a20] overflow-hidden flex-shrink-0">
          {indicator.image ? (
            <img src={indicator.image} alt={indicator.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <>
              <ChartPreviewSVG />
              <div className="absolute top-4 right-6 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">TP</div>
              <div className="absolute bottom-4 right-6 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">SL</div>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08061a] via-transparent to-transparent opacity-60" />
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex flex-col flex-1 px-8 pt-6 pb-7">
          {/* 이름 + 부제목 */}
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold group-hover:text-cyan-400 transition-colors duration-300">
              {indicator.name}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">{indicator.subtitle}</p>
          </CardHeader>

          {/* 설명 */}
          <CardContent className="p-0 flex-1">
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-4">{indicator.content}</p>

            {/* 태그 */}
            {indicator.tags && indicator.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {indicator.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-gray-800/60 border border-gray-700/40 text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>

          {/* 상세보기 CTA */}
          <div className="mt-6 pt-4 border-t border-gray-800/50">
            <div className="flex items-center gap-1.5 text-sm text-cyan-500 group-hover:text-cyan-400 transition-colors font-medium">
              상세보기
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

/* ─── 차트 미리보기 SVG ─── */
function ChartPreviewSVG({ large = false }: { large?: boolean }) {
  const h = large ? 208 : 160
  return (
    <svg
      viewBox={`0 0 400 ${h}`}
      fill="none"
      className="absolute inset-0 w-full h-full opacity-40"
      preserveAspectRatio="none"
    >
      {/* 캔들스틱 모양 */}
      {[40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340, 370].map((x, i) => {
        const isUp = [0, 2, 3, 5, 7, 8, 10, 11].includes(i)
        const bodyH = 8 + Math.random() * 20
        const wickH = bodyH + 6 + Math.random() * 10
        const baseY = 30 + Math.sin(i * 0.5) * 20 + (i < 6 ? i * 4 : (12 - i) * 4)
        return (
          <g key={i}>
            <line
              x1={x} y1={baseY - wickH / 2}
              x2={x} y2={baseY + wickH / 2}
              stroke={isUp ? "#06b6d4" : "#ef4444"}
              strokeWidth="1"
              opacity="0.6"
            />
            <rect
              x={x - 6} y={baseY - bodyH / 2}
              width="12" height={bodyH}
              fill={isUp ? "#06b6d4" : "#ef4444"}
              rx="1"
              opacity="0.6"
            />
          </g>
        )
      })}
      {/* 트렌드 라인 */}
      <line x1="30" y1={h * 0.7} x2="380" y2={h * 0.3} stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
    </svg>
  )
}
