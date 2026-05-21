import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { IndicatorGridSkeleton } from "../ui/skeleton"
import { useIndicators } from "../../hooks/useIndicators"
import type { Indicator } from "../../types"

export { IndicatorCard, ChartPreviewSVG }

export default function Indicators() {
  const { indicators, isLoading, isLive } = useIndicators()
  const preview = indicators.slice(0, 3)

  return (
    <section id="indicators" className="relative md:min-h-[100dvh] md:h-full flex flex-col justify-center overflow-x-hidden py-20">
      {/* Section bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a081e] to-transparent" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.06)_0%,_transparent_70%)]" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-screen-2xl mx-auto">
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
            <IndicatorGridSkeleton count={3} />
          ) : (
            <>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 items-stretch [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {preview.map((indicator, idx) => (
                  <div key={indicator.id || idx} className="shrink-0 w-[80vw] md:w-auto snap-center">
                    <IndicatorCard
                      indicator={indicator}
                      idx={idx}
                    />
                  </div>
                ))}
              </div>

              {/* 전체보기 버튼 */}
              <div className="flex justify-center mt-12">
                <Link
                  to="/indicators"
                  className="group flex items-center gap-2 px-8 py-3 rounded-xl border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-300 text-sm font-medium"
                >
                  전체 보조지표 보기
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
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
        <div className="relative h-96 overflow-hidden flex-shrink-0 rounded-t-2xl">
          {indicator.image ? (
            <img src={indicator.image} alt={indicator.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <ChartPreviewSVG />
          )}
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
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-6">
              {indicator.description || indicator.content}
            </p>

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
  const W = 400
  const H = large ? 220 : 180

  // 캔들 데이터 (고정값 — 매번 동일하게 렌더)
  const candles = [
    { x: 28,  o: 130, c: 118, h: 112, l: 134 },
    { x: 52,  o: 118, c: 128, h: 112, l: 132 },
    { x: 76,  o: 128, c: 122, h: 118, l: 130 },
    { x: 100, o: 122, c: 108, h: 104, l: 126 },
    { x: 124, o: 108, c: 116, h: 104, l: 120 },
    { x: 148, o: 116, c: 100, h: 96,  l: 120 },
    { x: 172, o: 100, c: 112, h: 94,  l: 116 },
    { x: 196, o: 112, c: 106, h: 102, l: 116 },
    { x: 220, o: 106, c: 90,  h: 86,  l: 110 },
    { x: 244, o: 90,  c: 102, h: 84,  l: 106 },
    { x: 268, o: 102, c: 95,  h: 90,  l: 108 },
    { x: 292, o: 95,  c: 82,  h: 78,  l: 98  },
    { x: 316, o: 82,  c: 96,  h: 76,  l: 100 },
    { x: 340, o: 96,  c: 88,  h: 84,  l: 100 },
    { x: 364, o: 88,  c: 76,  h: 72,  l: 92  },
  ]

  // 매수/매도 시그널 위치
  const buys  = [candles[1], candles[6], candles[9], candles[12]]
  const sells = [candles[3], candles[8], candles[11], candles[14]]

  const isUp = (c: typeof candles[0]) => c.c <= c.o

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 배경 */}
      <rect width={W} height={H} fill="#0b0e1a" />

      {/* 수평 그리드 */}
      {[0.25, 0.5, 0.75].map((r, i) => (
        <line key={i} x1="0" y1={H * r} x2={W} y2={H * r}
          stroke="#1e2235" strokeWidth="1" />
      ))}

      {/* 캔들 */}
      {candles.map((c, i) => {
        const up = isUp(c)
        const col = up ? "#06b6d4" : "#f43f5e"
        return (
          <g key={i}>
            <line x1={c.x} y1={c.h} x2={c.x} y2={c.l}
              stroke={col} strokeWidth="1.2" opacity="0.7" />
            <rect
              x={c.x - 7} y={Math.min(c.o, c.c)}
              width="14" height={Math.max(Math.abs(c.o - c.c), 2)}
              fill={up ? "#06b6d4" : "#f43f5e"}
              fillOpacity={up ? 0.85 : 0.8}
              rx="1.5"
            />
          </g>
        )
      })}

      {/* 매수 화살표 (위쪽 삼각형, 캔들 아래) */}
      {buys.map((c, i) => (
        <g key={i}>
          <polygon
            points={`${c.x},${c.l + 16} ${c.x - 8},${c.l + 28} ${c.x + 8},${c.l + 28}`}
            fill="#06b6d4" opacity="0.9"
          />
          <text x={c.x} y={c.l + 42} textAnchor="middle"
            fill="#06b6d4" fontSize="7.5" fontWeight="bold" opacity="0.85">BUY</text>
        </g>
      ))}

      {/* 매도 화살표 (아래쪽 삼각형, 캔들 위) */}
      {sells.map((c, i) => (
        <g key={i}>
          <polygon
            points={`${c.x},${c.h - 16} ${c.x - 8},${c.h - 28} ${c.x + 8},${c.h - 28}`}
            fill="#f43f5e" opacity="0.9"
          />
          <text x={c.x} y={c.h - 32} textAnchor="middle"
            fill="#f43f5e" fontSize="7.5" fontWeight="bold" opacity="0.85">SELL</text>
        </g>
      ))}

      {/* 현재가 점선 */}
      <line x1="0" y1={candles[candles.length - 1].c} x2={W} y2={candles[candles.length - 1].c}
        stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.5" />
      <rect x={W - 52} y={candles[candles.length - 1].c - 8} width="50" height="16"
        fill="#06b6d4" fillOpacity="0.15" rx="3" />
      <text x={W - 27} y={candles[candles.length - 1].c + 4.5}
        textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="bold" opacity="0.9">
        79,748
      </text>
    </svg>
  )
}
