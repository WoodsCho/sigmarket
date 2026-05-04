import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, TrendingUp, BarChart3, Zap } from "lucide-react"
import { dummyRankings } from "../../data"
import type { RankingEntry } from "../../types"
import FreeTrialModal from "../FreeTrialModal"

/* ─── 스파클 파티클 ─── */
const SPARKLES = [
  // 핵심 중앙 밀집 (left 44~56%, top 0~12%)
  { top: "2%",  left: "47%",  size: 2.5, delay: "0s",    dur: "3.8s" },
  { top: "5%",  left: "51%",  size: 1.5, delay: "0.7s",  dur: "3.2s" },
  { top: "1%",  left: "53%",  size: 2,   delay: "1.5s",  dur: "4.0s" },
  { top: "8%",  left: "49%",  size: 1.5, delay: "0.3s",  dur: "3.5s" },
  { top: "4%",  left: "55%",  size: 2,   delay: "2.0s",  dur: "3.1s" },
  { top: "10%", left: "52%",  size: 1.5, delay: "1.1s",  dur: "4.2s" },
  { top: "3%",  left: "45%",  size: 2,   delay: "0.5s",  dur: "3.6s" },
  { top: "7%",  left: "44%",  size: 1.5, delay: "1.9s",  dur: "2.9s" },
  { top: "12%", left: "48%",  size: 2,   delay: "2.6s",  dur: "3.3s" },
  { top: "6%",  left: "57%",  size: 1.5, delay: "0.9s",  dur: "3.9s" },
  // 바깥으로 옅게 퍼지는 별 (크기 더 작게)
  { top: "0%",  left: "41%",  size: 1.5, delay: "1.4s",  dur: "3.0s" },
  { top: "14%", left: "54%",  size: 1.5, delay: "2.9s",  dur: "2.7s" },
  { top: "9%",  left: "60%",  size: 1,   delay: "0.4s",  dur: "4.4s" },
  { top: "16%", left: "46%",  size: 1,   delay: "1.7s",  dur: "3.8s" },
  { top: "3%",  left: "62%",  size: 1,   delay: "2.3s",  dur: "3.5s" },
]

function SparkleLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: s.top, left: s.left }}
        >
          {/* 십자 스파클 */}
          <div
            style={{
              width: s.size,
              height: s.size * 4,
              background: 'linear-gradient(to bottom, transparent, rgba(190,235,255,0.45), transparent)',
              borderRadius: 99,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: `sparkle-float ${s.dur} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          />
          <div
            style={{
              width: s.size * 4,
              height: s.size,
              background: 'linear-gradient(to right, transparent, rgba(190,235,255,0.45), transparent)',
              borderRadius: 99,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: `sparkle-float ${s.dur} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          />
        </div>
      ))}
    </div>
  )
}


const POS_STYLES: Record<string, { text: string; bg: string }> = {
  LONG: { text: "text-cyan-400", bg: "bg-cyan-400/10" },
  SHORT: { text: "text-pink-500", bg: "bg-pink-500/10" },
}
function returnColor(entry: RankingEntry) {
  if (entry.position === "SHORT") return entry.color === "purple" ? "text-purple-400" : "text-pink-500"
  if (entry.color === "purple") return "text-purple-400"
  if (entry.color === "pink") return "text-pink-500"
  return "text-cyan-400"
}

type Period = "daily" | "weekly" | "monthly"

/* ─── 카운트업 애니메이션 ─── */
function useCountUp(target: number, duration = 1600) {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])

  return value
}

/* ─── 미니 스탯 카드 ─── */
function StatCard({ icon: Icon, label, value, suffix, color, delay }: {
  icon: typeof TrendingUp; label: string; value: string; suffix?: string; color: string; delay: string
}) {
  return (
    <div className={`hero-stat-card flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm`} style={{ animationDelay: delay }}>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[11px] text-gray-500">{label}</p>
        <p className="text-sm font-bold text-white">{value}{suffix && <span className="text-xs text-gray-400 ml-0.5">{suffix}</span>}</p>
      </div>
    </div>
  )
}

export default function Hero() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>("daily")
  const [trialOpen, setTrialOpen] = useState(false)
  const rankings = dummyRankings
  const topReturn = useCountUp(44)
  const avgReturn = useCountUp(18)

  return (
    <>
    <section className="relative overflow-hidden min-h-screen md:h-full flex flex-col justify-center pt-32 md:pt-20">

      {/* ─── 배경 레이어 ─── */}
      {/* 상단 은은한 원형 글로우 (LuxAlgo 스타일) — 브리딩 애니메이션 */}
      <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none animate-[glow-breathe_6s_ease-in-out_infinite]" style={{ background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.12) 0%, rgba(99,102,241,0.07) 40%, transparent 70%)' }} />
      <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-blue-500/[0.08] blur-[100px] pointer-events-none animate-[glow-breathe_5s_ease-in-out_infinite_1s]" />
      {/* 글로우 오브 */}
      <div className="absolute top-1/4 left-[15%] w-[500px] h-[500px] bg-cyan-600/8 blur-[180px] rounded-full pointer-events-none animate-[glow-breathe_7s_ease-in-out_infinite_0.5s]" />
      <div className="absolute top-1/3 right-[10%] w-[400px] h-[400px] bg-purple-600/8 blur-[160px] rounded-full pointer-events-none animate-[glow-breathe_8s_ease-in-out_infinite_2s]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pink-600/5 blur-[140px] rounded-full pointer-events-none animate-[glow-breathe_6s_ease-in-out_infinite_3s]" />
      {/* 그리드 패턴 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* 스파클 파티클 */}
      <SparkleLayer />
      {/* 상단 → 하단 페이드 */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--theme-bg)] to-transparent pointer-events-none" />

      {/* ─── 메인 그리드 ─── */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

        {/* ═══ 왼쪽: 텍스트 + CTA ═══ */}
        <div className="lg:col-span-5 flex flex-col items-start text-left">

          {/* 뱃지 */}
          <div className="hero-fade-in inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-cyan-400 tracking-wide uppercase">TradingView Powered</span>
          </div>

          {/* 타이틀 */}
          <h1 className="hero-fade-in hero-delay-1 text-4xl md:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.15] break-keep text-white mb-6">
            판단을 단순하게
            <br />
            <span className="text-gradient">만드세요</span>
          </h1>

          <p className="hero-fade-in hero-delay-2 text-lg md:text-xl text-gray-300 mb-6 font-medium break-keep leading-relaxed">
            복잡한 분석 대신,
            <br />
            명확한 조건으로 매매에 구조를 입힙니다.
          </p>

          <p className="hero-fade-in hero-delay-3 text-sm text-gray-500 mb-10 break-keep leading-relaxed border-l-2 border-cyan-500/30 pl-4">
            주식, 해외선물, 크립토, 외환 등
            <br />
            모든 변동성 시장에 최적화되어 있습니다.
          </p>

          {/* CTA 버튼 그룹 */}
          <div className="hero-fade-in hero-delay-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
            <button
              onClick={() => setTrialOpen(true)}
              className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-sm transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.35)] hover:scale-[1.03] active:scale-[0.98]">
              <span className="relative z-10 flex items-center gap-2">
                3일 무료 체험하기
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10" />
            </button>
            <button onClick={() => navigate("/indicators")} className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-400 hover:text-white font-medium transition-colors duration-300">
              인디케이터 보기
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 미니 스탯 */}
          <div className="hero-fade-in hero-delay-5 flex flex-wrap justify-center lg:justify-start gap-3">
            <StatCard icon={TrendingUp} label="최고 수익률" value={`+${topReturn}%`} color="bg-cyan-500/10 text-cyan-400" delay="0.6s" />
            <StatCard icon={BarChart3} label="평균 수익률" value={`+${avgReturn}%`} color="bg-purple-500/10 text-purple-400" delay="0.75s" />
            <StatCard icon={Zap} label="인디케이터" value="10+" suffix="개" color="bg-pink-500/10 text-pink-400" delay="0.9s" />
          </div>
        </div>

        {/* ═══ 오른쪽: 수익률 랭킹 터미널 ═══ */}
        <div className="lg:col-span-7 hero-fade-in hero-delay-3 relative">
          {/* 터미널 글로우 */}
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

          <div className="relative bg-[#0d1117] border border-gray-700/40 rounded-2xl shadow-2xl shadow-black/40 flex flex-col h-[340px] md:h-[440px] lg:h-[520px] overflow-hidden font-mono">

            {/* 터미널 타이틀바 */}
            <div className="px-5 py-3 border-b border-gray-700/40 flex justify-between items-center bg-[#161b22] shrink-0">
              <div className="flex items-center gap-3">
                {/* 트래픽 라이트 */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-400 font-medium">수익률 랭킹</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                  TOP 10
                </span>
              </div>

              {/* 기간 토글 */}
              <div className="flex bg-[#0d1117] p-0.5 rounded-lg border border-gray-700/40">
                {([
                  { key: "daily" as Period, label: "전일" },
                  { key: "weekly" as Period, label: "지난주" },
                  { key: "monthly" as Period, label: "지난달" },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPeriod(key)}
                    className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all duration-200 ${
                      period === key
                        ? "bg-cyan-500/15 text-cyan-400 font-bold shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 테이블 바디 */}
            <div className="overflow-y-auto custom-scrollbar flex-1 relative bg-[#0d1117]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-[#161b22]/95 backdrop-blur-sm">
                  <tr className="text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-700/40">
                    <th className="px-5 py-2.5 font-semibold w-10 text-center">#</th>
                    <th className="px-3 py-2.5 font-semibold">종목</th>
                    <th className="px-3 py-2.5 font-semibold">시그널</th>
                    <th className="px-3 py-2.5 font-semibold">진입</th>
                    <th className="px-3 py-2.5 font-semibold">성과</th>
                    <th className="px-3 py-2.5 font-semibold">포지션</th>
                    <th className="px-5 py-2.5 font-semibold text-right">수익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/20 text-xs">
                  {rankings.map((entry, i) => {
                    const pos = POS_STYLES[entry.position] || POS_STYLES.LONG
                    const retCol = returnColor(entry)
                    const baseSymbol = entry.symbol.split("/")[0].toLowerCase()
                    return (
                      <tr
                        key={entry.rank}
                        className="hero-table-row bg-[#0d1117] hover:bg-white/[0.03] transition-colors group"
                        style={{ animationDelay: `${0.4 + i * 0.04}s` }}
                      >
                        <td className="px-5 py-2.5 text-center">
                          {entry.rank <= 3 ? (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${
                              entry.rank === 1
                                ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25"
                                : entry.rank === 2
                                ? "bg-gray-400/15 text-gray-300 border border-gray-400/25"
                                : "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                            }`}>
                              {entry.rank}
                            </span>
                          ) : (
                            <span className="text-gray-600 font-medium">{entry.rank}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-gray-300">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gray-800/80 border border-gray-700/50 overflow-hidden flex items-center justify-center flex-shrink-0">
                              <img
                                src={`https://assets.coincap.io/assets/icons/${baseSymbol}@2x.png`}
                                alt={baseSymbol}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const el = e.target as HTMLImageElement
                                  el.style.display = "none"
                                  el.parentElement!.innerHTML = `<span class="text-[8px] font-bold text-gray-500">${baseSymbol.slice(0,2).toUpperCase()}</span>`
                                }}
                              />
                            </div>
                            <span className="text-[11px]">{entry.symbol}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-gray-800/40 border border-gray-700/30 text-[10px] text-gray-400">
                            {entry.signal}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-gray-400 text-[11px]">{entry.entryPrice}</div>
                          <div className="text-[9px] text-gray-600 mt-0.5">{entry.entryDate}</div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-300 text-[11px]">
                          {entry.resultPrice}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`${pos.text} font-bold ${pos.bg} px-2 py-0.5 rounded-md text-[10px] border ${
                            entry.position === "LONG" ? "border-cyan-400/20" : "border-pink-500/20"
                          }`}>
                            {entry.position}
                          </span>
                        </td>
                        <td className={`px-5 py-2.5 text-right font-bold text-sm ${retCol}`}>
                          +{entry.returnPct.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 하단 안내 */}
            <div className="bg-[#161b22] border-t border-gray-700/40 px-5 py-3 shrink-0 flex items-start gap-2">
              <span className="text-cyan-500/50 text-[10px] mt-0.5 font-mono">$</span>
              <p className="text-[10px] text-gray-500 leading-relaxed break-keep">
                수익률은 진입 이후 성과 가격(LONG: 최고가, SHORT: 최저가) 기준으로 산정되며, 실제 수익은 트레이더의 성향과 경험에 따라 크게 달라질 수 있음을 알려드립니다.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>

    <FreeTrialModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </>
  )
}
