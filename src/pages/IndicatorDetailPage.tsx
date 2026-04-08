import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, Zap, TrendingUp, Activity, BarChart3, Layers, Target, Combine } from "lucide-react"
import { useIndicators } from "../hooks/useIndicators"
import { Header, Footer } from "../components/sections"
import StrategyChart from "../components/StrategyChart"
import type { ContentSection } from "../types"

/* ─── 색상 팔레트 ─── */
const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cyan:    { bg: "bg-cyan-950/30",    text: "text-cyan-400",    border: "border-cyan-900/50" },
  pink:    { bg: "bg-pink-950/30",    text: "text-pink-400",    border: "border-pink-900/50" },
  purple:  { bg: "bg-purple-950/30",  text: "text-purple-400",  border: "border-purple-900/50" },
  blue:    { bg: "bg-blue-950/30",    text: "text-blue-400",    border: "border-blue-900/50" },
  orange:  { bg: "bg-orange-950/30",  text: "text-orange-400",  border: "border-orange-900/50" },
  emerald: { bg: "bg-emerald-950/30", text: "text-emerald-400", border: "border-emerald-900/50" },
}

const SECTION_COLORS = [
  { text: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/30", hover: "hover:border-cyan-500/30", bullet: "bg-cyan-400" },
  { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30", hover: "hover:border-purple-500/30", bullet: "bg-purple-400" },
  { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", hover: "hover:border-blue-500/30", bullet: "bg-blue-400" },
  { text: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/30", hover: "hover:border-pink-500/30", bullet: "bg-pink-400" },
  { text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30", hover: "hover:border-orange-500/30", bullet: "bg-orange-400" },
  { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", hover: "hover:border-emerald-500/30", bullet: "bg-emerald-400" },
]

const SECTION_ICONS = [Layers, Target, Zap, Combine, BarChart3, TrendingUp, Activity]

/* ─── 레거시 content → sections 변환 ─── */
function parseContent(content: string): ContentSection[] {
  if (!content) return []
  const blocks = content.split(/\n---\n|\n---|\n?-{3,}\n?/).map(b => b.trim()).filter(Boolean)
  const result = blocks.map((block): ContentSection => {
    const lines = block.split("\n").filter(Boolean)
    let title = ""
    let bodyLines = lines
    if (lines[0] && /^(#{1,3}\s|[\d]+[.)]\s)/.test(lines[0])) {
      title = lines[0].replace(/^#{1,3}\s*/, "").replace(/^[\d]+[.)]\s*/, "").trim()
      bodyLines = lines.slice(1)
    }
    let highlight = ""
    const rest: string[] = []
    for (const line of bodyLines) {
      if (/^💡/.test(line.trim())) highlight = line.trim().replace(/^💡\s*/, "")
      else rest.push(line)
    }
    return { title, body: rest.join("\n").trim(), highlight }
  })
  // 레거시 content: 첫 2개는 half, 나머지는 full
  return result.map((s, i) => ({ ...s, layout: (i < 2 ? "half" : "full") as "half" | "full" }))
}

export default function IndicatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { indicators, isLoading } = useIndicators()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  const idx = Number(id)
  const indicator = indicators[idx]

  if (!indicator) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] text-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-gray-400 text-lg mb-4">인디케이터를 찾을 수 없습니다.</p>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-cyan-500 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="h-4 w-4" /> 메인으로 돌아가기
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  // sections 필드 우선, 없으면 content 파싱으로 폴백
  const sections: ContentSection[] =
    indicator.sections && indicator.sections.length > 0
      ? indicator.sections
      : parseContent(indicator.content)

  const hasSections = sections.length > 0

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-white relative overflow-x-hidden">
      <Header />

      {/* 배경 글로우 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-900/20 blur-[150px] rounded-full pointer-events-none z-0" />

      <section className="relative z-10 container mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">

          {/* 뒤로가기 */}
          <button
            onClick={() => navigate("/#indicators")}
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

          {/* ═══ 콘텐츠 카드 그리드 ═══ */}
          {hasSections ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {sections.map((section, i) => (
                <SectionCard key={i} section={section} index={i} isFullWidth={section.layout === "full"} />
              ))}
            </div>
          ) : (
            indicator.content && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 md:p-10 mb-8">
                <p className="text-gray-300 text-base leading-relaxed whitespace-pre-line">{indicator.content}</p>
              </div>
            )
          )}


        </div>
      </section>

      <Footer />
    </div>
  )
}

/* ═══════════════════════════════════════
   섹션 카드 — sigma_box.html 디자인 1:1
   ═══════════════════════════════════════ */
function SectionCard({ section, index, isFullWidth }: { section: ContentSection; index: number; isFullWidth: boolean }) {
  const color = SECTION_COLORS[index % SECTION_COLORS.length]
  const Icon = SECTION_ICONS[index % SECTION_ICONS.length]

  return (
    <div
      className={`
        ${isFullWidth ? "md:col-span-2" : ""}
        ${isFullWidth
          ? "bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-gray-700 shadow-xl"
          : "bg-gray-900/40 border-gray-800"}
        border rounded-2xl p-8 md:p-10
        ${color.hover} transition-colors group relative
      `}
    >
      {/* 배경 글로우 */}
      {isFullWidth && (
        <div className={`absolute top-0 right-0 w-64 h-64 ${color.bg} blur-[80px] rounded-full pointer-events-none opacity-50 overflow-hidden`} />
      )}

      <div className="relative z-10">
        {/* ─── 헤더 ─── */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center ${color.text} font-bold font-mono text-sm border border-gray-700`}>
            {index + 1}
          </span>
          {section.title ? (
            <h3 className={`${isFullWidth ? "text-2xl" : "text-xl"} font-bold text-white tracking-tight`}>
              {section.title}
            </h3>
          ) : (
            <Icon className={`h-5 w-5 ${color.text}`} />
          )}
        </div>

        {/* ─── 레이아웃: 풀와이드에서 infoCards 있으면 2열 ─── */}
        {isFullWidth && section.infoCards && section.infoCards.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0 overflow-hidden">
              {/* 본문 */}
              <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line break-words mb-4">
                {section.body}
              </p>
              {/* 불릿 */}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="space-y-2 text-sm text-gray-300 font-medium bg-gray-800/30 p-4 rounded-lg border border-gray-800/50">
                  {section.bullets.map((b, bi) => (
                    <li key={bi} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${SECTION_COLORS[bi % SECTION_COLORS.length].bullet}`} />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {/* 하이라이트 */}
              {section.highlight && (
                <p className={`${color.text} text-sm font-semibold mt-4 ${color.bg} p-3 rounded-lg border ${color.border}`}>
                  💡 {section.highlight}
                </p>
              )}
            </div>

            {/* 정보 카드 (TP/SL) */}
            <div className="md:w-[340px] flex-shrink-0 flex flex-col gap-3">
              {section.infoCards.map((card, ci) => {
                const bc = BADGE_COLORS[card.badgeColor] || BADGE_COLORS.cyan
                return (
                  <div key={ci} className={`${bc.bg} border ${bc.border} p-4 rounded-xl flex items-start gap-4`}>
                    <div className={`px-2 py-1 rounded ${bc.bg} ${bc.text} text-xs font-bold mt-0.5`}>
                      {card.badge}
                    </div>
                    <div>
                      <h4 className={`${bc.text} font-bold text-sm mb-1`}>{card.title}</h4>
                      <p className="text-gray-400 text-xs break-keep">{card.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            {/* 본문 */}
            <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line break-words">
              {section.body}
            </p>

            {/* 불릿 리스트 */}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-gray-300 font-medium bg-gray-800/30 p-4 rounded-lg border border-gray-800/50">
                {section.bullets.map((b, bi) => (
                  <li key={bi} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${SECTION_COLORS[bi % SECTION_COLORS.length].bullet}`} />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {/* 그리드 아이템 (상단/중단/하단 등) */}
            {section.gridItems && section.gridItems.length > 0 && (
              <div className={`mt-4 grid ${section.gridItems.length <= 2 ? "grid-cols-2" : "grid-cols-2"} gap-3`}>
                {section.gridItems.map((g, gi) => (
                  <div
                    key={gi}
                    className={`bg-gray-800/30 p-3 rounded-lg border border-gray-800/50 text-center text-sm text-gray-300 font-medium
                      ${gi === section.gridItems!.length - 1 && section.gridItems!.length % 2 !== 0 ? "col-span-2 border-purple-500/30 text-purple-300" : ""}`}
                  >
                    {g}
                  </div>
                ))}
              </div>
            )}

            {/* 정보 카드 (TP/SL) — 비 풀와이드 */}
            {section.infoCards && section.infoCards.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {section.infoCards.map((card, ci) => {
                  const bc = BADGE_COLORS[card.badgeColor] || BADGE_COLORS.cyan
                  return (
                    <div key={ci} className={`${bc.bg} border ${bc.border} p-4 rounded-xl flex items-start gap-4`}>
                      <div className={`px-2 py-1 rounded ${bc.bg} ${bc.text} text-xs font-bold mt-0.5`}>{card.badge}</div>
                      <div>
                        <h4 className={`${bc.text} font-bold text-sm mb-1`}>{card.title}</h4>
                        <p className="text-gray-400 text-xs break-keep">{card.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 하이라이트 */}
            {section.highlight && (
              <p className={`${color.text} text-sm font-semibold mt-6 ${color.bg} p-4 rounded-xl border ${color.border}`}>
                💡 {section.highlight}
              </p>
            )}

            {/* 조합 카드 (A + B = C) */}
            {section.combo && (
              <div className="mt-6 flex-shrink-0 bg-gray-950 p-5 rounded-xl border border-gray-800 flex items-center gap-4 justify-center flex-wrap">
                <div className="text-center">
                  <span className="block text-cyan-400 font-bold text-sm mb-1">{section.combo.left.label}</span>
                  <span className="text-gray-300 font-medium text-xs">{section.combo.left.sub}</span>
                </div>
                <span className="text-gray-600 font-bold text-lg">+</span>
                <div className="text-center">
                  <span className="block text-purple-400 font-bold text-sm mb-1">{section.combo.right.label}</span>
                  <span className="text-gray-300 font-medium text-xs">{section.combo.right.sub}</span>
                </div>
                <span className="text-gray-600 font-bold text-lg">=</span>
                <div className="text-center bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                  <span className="block text-white font-bold text-sm">{section.combo.result}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


