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
    <section className="relative overflow-hidden flex items-center justify-center pt-30 pb-16">
      {/* ─── 배경 글로우 ─── */}
      <div className="fixed top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-pink-900/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* ─── 메인 그리드 ─── */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

        {/* ═══ 왼쪽: 텍스트 + CTA ═══ */}
        <div className="lg:col-span-5 flex flex-col items-start text-left h-[480px] justify-start pt-8">
          {/* 타이틀 */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-12 leading-tight break-keep text-gray-100">
            판단을 단순하게
            <br />
            만드세요
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-12 font-medium break-keep">
            복잡한 분석 대신
            <br />
            명확한 조건으로 매매에 구조를 입힙니다.
          </p>

          <p className="text-xs md:text-sm text-gray-400 mb-16 break-keep leading-relaxed border-l-2 border-gray-700 pl-4">
            주식, 해외선물, 크립토, 외환 등
            <br />
            모든 변동성 시장에 최적화되어 있습니다.
          </p>

          <button className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-base hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300">
            3일동안 알림 받기 (free)
          </button>
        </div>

        {/* ═══ 오른쪽: 수익률 랭킹 터미널 ═══ */}
        <div className="lg:col-span-7 bg-[#0d1117] border border-gray-700/50 rounded-md shadow-2xl flex flex-col h-[480px] overflow-hidden font-mono">

          {/* 터미널 타이틀바 */}
          <div className="px-4 py-2.5 border-b border-gray-700/50 flex justify-between items-center bg-[#161b22] shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">수익률 랭킹</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white border border-white/30">
                TOP 10
              </span>
            </div>

            {/* 기간 토글 */}
            <div className="flex bg-[#0d1117] p-0.5 rounded border border-gray-700/50">
              {([
                { key: "daily" as Period, label: "전일" },
                { key: "weekly" as Period, label: "지난주" },
                { key: "monthly" as Period, label: "지난달" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${
                    period === key
                      ? "bg-gray-700/50 text-white font-bold"
                      : "text-gray-500 hover:text-white"
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
              <thead className="sticky top-0 z-20 bg-[#161b22] shadow-sm">
                <tr className="text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-700/50">
                  <th className="px-4 py-2.5 font-semibold w-10 text-center">#</th>
                  <th className="px-3 py-2.5 font-semibold">종목</th>
                  <th className="px-3 py-2.5 font-semibold">시그널</th>
                  <th className="px-3 py-2.5 font-semibold">진입</th>
                  <th className="px-3 py-2.5 font-semibold">성과</th>
                  <th className="px-3 py-2.5 font-semibold">포지션</th>
                  <th className="px-4 py-2.5 font-semibold text-right">수익률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30 text-xs">
                {rankings.map((entry) => {
                  const pos = POS_STYLES[entry.position] || POS_STYLES.LONG
                  const retCol = returnColor(entry)
                  const baseSymbol = entry.symbol.split("/")[0].toLowerCase()
                  return (
                    <tr key={entry.rank} className="bg-[#0d1117] hover:bg-gray-800/30 transition-colors group">
                      <td className="px-4 py-2 text-center text-gray-500 font-bold">
                        {entry.rank}
                      </td>
                      <td className="px-3 py-2 font-bold text-gray-300">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://assets.coincap.io/assets/icons/${baseSymbol}@2x.png`}
                            alt={baseSymbol}
                            className="w-4 h-4 rounded-full"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                          />
                          {entry.symbol}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/40 text-[10px] text-gray-400">
                          {entry.signal}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-gray-400">{entry.entryPrice}</div>
                        <div className="text-[9px] text-gray-600 mt-0.5">{entry.entryDate}</div>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-300">
                        {entry.resultPrice}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`${pos.text} font-bold ${pos.bg} px-1.5 py-0.5 rounded text-[10px]`}>
                          {entry.position}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right font-bold text-sm ${retCol}`}>
                        +{entry.returnPct.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 하단 안내 */}
          <div className="bg-[#161b22] border-t border-gray-700/50 px-4 py-2.5 shrink-0 flex items-start gap-2">
            <span className="text-green-500/60 text-[10px] mt-0.5">$</span>
            <p className="text-[10px] text-gray-500 leading-relaxed break-keep">
              수익률은 진입 이후 성과 가격(LONG: 최고가, SHORT: 최저가) 기준으로 산정되며, 실제 수익은 트레이더의 성향과 경험에 따라 크게 달라질 수 있음을 알려드립니다.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
