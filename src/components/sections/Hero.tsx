import { useState } from "react"
import { Info } from "lucide-react"
import { dummyRankings } from "../../data"
import type { RankingEntry } from "../../types"

/* ─── 색상 매핑 ─── */
const DOT_COLORS: Record<string, string> = {
  cyan: "bg-cyan-400",
  purple: "bg-purple-400",
  pink: "bg-pink-500",
  gray: "bg-gray-400",
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

export default function Hero() {
  const [period, setPeriod] = useState<Period>("daily")
  // 나중에 DB 연동 시: useRankings(period) 훅으로 교체
  const rankings = dummyRankings

  return (
    <section className="relative overflow-hidden flex items-center justify-center pt-24 pb-16">
      {/* ─── 배경 글로우 ─── */}
      <div className="fixed top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-pink-900/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* ─── 메인 그리드 ─── */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

        {/* ═══ 왼쪽: 텍스트 + CTA ═══ */}
        <div className="lg:col-span-5 flex flex-col items-start text-left">
          {/* 로고 */}
          <div className="mb-8 flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
              <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM14 8C15.1046 8 16 8.89543 16 10C16 11.1046 15.1046 12 14 12C12.8954 12 12 11.1046 12 10C12 8.89543 12.8954 8 14 8Z" fill="currentColor" />
            </svg>
            <span className="text-2xl font-bold tracking-tight text-white">Sigmarket</span>
          </div>

          {/* 타이틀 */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 leading-tight break-keep text-gray-100">
            판단을 단순하게
            <br />
            만드세요
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-5 font-medium break-keep">
            복잡한 분석 대신
            <br />
            명확한 조건으로 매매에 구조를 입힙니다.
          </p>

          <p className="text-xs md:text-sm text-gray-400 mb-8 break-keep leading-relaxed border-l-2 border-gray-700 pl-4">
            주식, 해외선물, 크립토, 외환 등
            <br />
            모든 변동성 시장에 최적화되어 있습니다.
          </p>

          <button className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-base hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300">
            3일동안 알림 받기 (free)
          </button>
        </div>

        {/* ═══ 오른쪽: 수익률 랭킹 테이블 ═══ */}
        <div className="lg:col-span-7 bg-gray-900/60 border border-gray-800 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col h-[480px] overflow-hidden">

          {/* 테이블 헤더 */}
          <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">수익률 랭킹</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                TOP 10
              </span>
            </div>

            {/* 기간 토글 */}
            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
              {([
                { key: "daily" as Period, label: "전일" },
                { key: "weekly" as Period, label: "지난주" },
                { key: "monthly" as Period, label: "지난달" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                    period === key
                      ? "bg-gray-800 text-cyan-400 font-bold shadow-sm"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 테이블 바디 */}
          <div className="overflow-y-auto custom-scrollbar flex-1 relative bg-gray-900/40">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-gray-900 shadow-sm">
                <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold w-10 text-center">순위</th>
                  <th className="px-3 py-3 font-semibold">종목</th>
                  <th className="px-3 py-3 font-semibold">시그널 (지표)</th>
                  <th className="px-3 py-3 font-semibold">진입</th>
                  <th className="px-3 py-3 font-semibold">성과 가격</th>
                  <th className="px-3 py-3 font-semibold">포지션</th>
                  <th className="px-4 py-3 font-semibold text-right">수익률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-xs">
                {rankings.map((entry) => {
                  const pos = POS_STYLES[entry.position] || POS_STYLES.LONG
                  const retCol = returnColor(entry)
                  const dotCol = DOT_COLORS[entry.color || "cyan"]
                  return (
                    <tr key={entry.rank} className="hover:bg-gray-800/50 transition-colors group">
                      <td className="px-4 py-2.5 text-center font-mono text-gray-500 font-bold group-hover:text-cyan-400">
                        {entry.rank}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotCol}`} />
                          {entry.symbol}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] text-gray-300">
                          {entry.signal}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-mono text-gray-300">{entry.entryPrice}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{entry.entryDate}</div>
                      </td>
                      <td className={`px-3 py-2.5 font-mono font-medium ${retCol}`}>
                        {entry.resultPrice}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`${pos.text} font-bold ${pos.bg} px-2 py-0.5 rounded text-[10px]`}>
                          {entry.position}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold text-sm ${retCol}`}>
                        +{entry.returnPct.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 하단 안내 */}
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 shrink-0 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-relaxed break-keep">
              수익률은 진입 이후 성과 가격(LONG: 최고가, SHORT: 최저가) 기준으로 산정되며, 실제 수익은 트레이더의 성향과 경험에 따라 크게 달라질 수 있음을 알려드립니다.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
