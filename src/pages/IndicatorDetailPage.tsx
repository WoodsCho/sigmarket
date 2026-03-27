import { useParams, useNavigate } from "react-router-dom"
import { Activity, ArrowLeft, TrendingUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { useIndicators } from "../hooks/useIndicators"
import { Header, Footer } from "../components/sections"

export default function IndicatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { indicators, isLoading } = useIndicators()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  const idx = Number(id)
  const indicator = indicators[idx]

  if (!indicator) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-gray-400 text-lg mb-4">인디케이터를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> 메인으로 돌아가기
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="container mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
          {/* 뒤로가기 */}
          <button
            onClick={() => navigate("/#indicators")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            All Sigma Setups
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽: 차트 + 기본 정보 */}
            <div>
              <h2 className="text-3xl font-bold mb-1">{indicator.name}</h2>
              <p className="text-gray-500 text-sm mb-6">{indicator.subtitle}</p>

              {/* 차트/이미지 영역 */}
              <div className="relative h-52 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl border border-zinc-800 overflow-hidden mb-6">
                {indicator.image ? (
                  <img src={indicator.image} alt={indicator.name} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ChartPreviewSVG />
                    <div className="absolute top-6 right-8 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold px-2 py-1 rounded">TP</div>
                    <div className="absolute bottom-6 right-8 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold px-2 py-1 rounded">SL</div>
                  </>
                )}
              </div>

              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{indicator.content}</p>
            </div>

            {/* 오른쪽: 성능 프로파일 + 시장 적합도 */}
            <div className="space-y-6">
              {/* 구조 성능 프로파일 */}
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    구조 성능 프로파일
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {indicator.scores.map((score, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{score.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${(score.value / score.max) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-white w-16 text-right">
                          {score.value.toFixed(1)} / {score.max.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 시장 적합도 */}
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    시장 적합도
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {indicator.marketFit.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-400">{item.label}</span>
                        <FitDot fit={item.fit} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 태그 */}
              <div className="flex gap-2 flex-wrap">
                {indicator.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-gray-400 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

/* ─── 적합도 도트 ─── */
function FitDot({ fit }: { fit: "high" | "mid" | "low" }) {
  const colors = {
    high: "bg-emerald-500",
    mid: "bg-yellow-500",
    low: "bg-zinc-600",
  }
  return (
    <div className="flex gap-1">
      <div className={`h-2 w-2 rounded-full ${colors[fit]}`} />
      <div className={`h-2 w-2 rounded-full ${fit === "high" ? colors.high : "bg-zinc-700"}`} />
      <div className={`h-2 w-2 rounded-full ${fit === "high" ? colors.high : fit === "mid" ? colors.mid : "bg-zinc-700"}`} />
    </div>
  )
}

/* ─── 차트 미리보기 SVG ─── */
function ChartPreviewSVG() {
  const h = 208
  return (
    <svg
      viewBox={`0 0 400 ${h}`}
      fill="none"
      className="absolute inset-0 w-full h-full opacity-60"
      preserveAspectRatio="none"
    >
      {[40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340, 370].map((x, i) => {
        const isUp = [0, 2, 3, 5, 7, 8, 10, 11].includes(i)
        const bodyH = 8 + Math.random() * 20
        const wickH = bodyH + 6 + Math.random() * 10
        const baseY = 30 + Math.sin(i * 0.5) * 20 + (i < 6 ? i * 4 : (12 - i) * 4)
        return (
          <g key={i}>
            <line x1={x} y1={baseY - wickH / 2} x2={x} y2={baseY + wickH / 2} stroke={isUp ? "#10b981" : "#ef4444"} strokeWidth="1" />
            <rect x={x - 6} y={baseY - bodyH / 2} width="12" height={bodyH} fill={isUp ? "#10b981" : "#ef4444"} rx="1" />
          </g>
        )
      })}
      <line x1="30" y1={h * 0.7} x2="380" y2={h * 0.3} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4" />
    </svg>
  )
}
