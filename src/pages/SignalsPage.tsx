import { useState } from "react"
import { ArrowLeft, Info, AlertTriangle, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Header, Footer } from "../components/sections"
import { useSignals } from "../hooks/useSignals"
import { dummyRankings } from "../data"
import type { Signal, RankingEntry } from "../types"

/* ─── 포지션 스타일 ─── */
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

/* ─── 수익률 랭킹 섹션 ─── */
function RankingSection() {
  const [period, setPeriod] = useState<Period>("daily")
  const rankings = dummyRankings

  return (
    <div className="bg-[#0d1117] border border-gray-700/50 rounded-md shadow-2xl flex flex-col overflow-hidden font-mono">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-[#161b22]">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">수익률 랭킹</span>
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

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-[#161b22]">
            <tr className="text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-700/50">
              <th className="px-4 py-2.5 font-semibold w-10 text-center">#</th>
              <th className="px-4 py-2.5 font-semibold">종목</th>
              <th className="px-4 py-2.5 font-semibold">시그널</th>
              <th className="px-4 py-2.5 font-semibold">진입가</th>
              <th className="px-4 py-2.5 font-semibold">진입시각</th>
              <th className="px-4 py-2.5 font-semibold">성과가</th>
              <th className="px-4 py-2.5 font-semibold">포지션</th>
              <th className="px-4 py-2.5 font-semibold text-right">수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/30 text-xs">
            {rankings.map((entry) => {
              const pos = POS_STYLES[entry.position] || POS_STYLES.LONG
              const retCol = returnColor(entry)
              const baseSymbol = entry.symbol.split("/")[0].toLowerCase()
              return (
                <tr key={entry.rank} className="bg-[#0d1117] hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-center text-gray-500 font-bold">{entry.rank}</td>
                  <td className="px-4 py-3 font-bold text-gray-300">
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
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/40 text-[10px] text-gray-400">
                      {entry.signal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{entry.entryPrice}</td>
                  <td className="px-4 py-3 text-gray-500 text-[11px]">{entry.entryDate}</td>
                  <td className="px-4 py-3 font-medium text-gray-300">{entry.resultPrice}</td>
                  <td className="px-4 py-3">
                    <span className={`${pos.text} font-bold ${pos.bg} px-1.5 py-0.5 rounded text-[10px]`}>
                      {entry.position}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold text-sm ${retCol}`}>
                    +{entry.returnPct.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 하단 안내 */}
      <div className="bg-[#161b22] border-t border-gray-700/50 px-4 py-2.5 flex items-start gap-2">
        <span className="text-green-500/60 text-[10px] mt-0.5">$</span>
        <p className="text-[10px] text-gray-500 leading-relaxed break-keep">
          수익률은 진입 이후 성과 가격(LONG: 최고가, SHORT: 최저가) 기준으로 산정되며, 실제 수익은 트레이더의 성향과 경험에 따라 크게 달라질 수 있음을 알려드립니다.
        </p>
      </div>
    </div>
  )
}

/* ─── 시그널 행 ─── */
function SignalRow({ signal }: { signal: Signal }) {
  const pos = POS_STYLES[signal.position] || POS_STYLES.LONG
  return (
    <tr className="bg-[#0d1117] hover:bg-gray-800/30 transition-colors">
      <td className="px-6 py-3">
        {signal.isNew ? (
          <span className="text-pink-400 font-bold text-xs bg-pink-400/10 px-2 py-1 rounded animate-pulse">
            {signal.timeAgo || "방금 전"}
          </span>
        ) : (
          <span className="text-gray-500 text-xs font-medium">{signal.timeAgo || `${signal.date} ${signal.time}`}</span>
        )}
      </td>
      <td className="px-6 py-3 font-bold text-gray-300">
        <div className="flex items-center gap-2">
          <img
            src={`https://assets.coincap.io/assets/icons/${signal.symbol.split("/")[0].toLowerCase()}@2x.png`}
            alt={signal.symbol.split("/")[0]}
            className="w-4 h-4 rounded-full flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[8px] text-gray-600 font-medium">{signal.symbol.split("/")[1]}</span>
            <span className="text-[11px] font-bold text-gray-200">{signal.symbol.split("/")[0]}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-3 text-gray-300">
        <span className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/40 text-[10px] text-gray-400">
          {signal.indicator || "—"}
        </span>
      </td>
      <td className="px-6 py-3 text-gray-400">{signal.price}</td>
      <td className="px-6 py-3">
        <span className={`${pos.text} font-bold ${pos.bg} px-1.5 py-0.5 rounded text-[10px]`}>{signal.position}</span>
      </td>
    </tr>
  )
}

/* ─── 실시간 시그널 섹션 ─── */
const PAGE_SIZE = 20

function SignalsSection() {
  const { signals, isLoading, isLive } = useSignals()
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(signals.length / PAGE_SIZE))
  const pagedSignals = signals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            실시간 시그널 현황
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-pink-500/10 border border-pink-500/30 text-pink-500 text-xs font-bold tracking-wider uppercase">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-pink-500 animate-pulse" : "bg-gray-500"}`} />
            {isLive ? "Live" : "Demo"}
          </span>
        </div>
        <a
          href="https://t.me/your_telegram_channel"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-cyan-500/50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
          실시간 알림 받기
        </a>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block h-10 w-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 mt-4 text-sm">시그널 로딩 중...</p>
        </div>
      ) : (
        <div className="bg-[#0d1117] border border-gray-700/50 rounded-md shadow-2xl overflow-hidden">
          <div className="overflow-x-auto w-full bg-[#0d1117] custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap font-mono">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#161b22] text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-700/50">
                  <th className="px-6 py-2.5 font-semibold w-32">실시간 알림</th>
                  <th className="px-6 py-2.5 font-semibold">종목</th>
                  <th className="px-6 py-2.5 font-semibold">시그널 (지표)</th>
                  <th className="px-6 py-2.5 font-semibold">진입</th>
                  <th className="px-6 py-2.5 font-semibold">포지션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30 text-xs">
                {pagedSignals.map((signal, idx) => (
                  <SignalRow key={signal.id || idx} signal={signal} />
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-[#0a0e16] border-t border-gray-700/50 px-6 py-3 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-mono">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, signals.length)} / {signals.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-mono transition-colors ${
                      i === page
                        ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold"
                        : "text-gray-500 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#161b22] border-t border-gray-700/50 p-5 px-6 flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed break-keep">
                포지션 종료는 상황에 따라 매우 달라지며, 본 "실시간 시그널 현황"에서는{" "}
                <strong className="text-gray-300">포지션 종료(청산) 시점을 별도로 제공하지 않습니다.</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed break-keep">
                실시간 시그널은 리딩이나 매매를 권장하는 것이 아니라 시그마켓 인디케이터의 기능을 안내하기 위해 제공되는 서비스이며, 시그널에 의한 매매의 손실은 책임지지 않습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 메인 페이지 ─── */
export default function SignalsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] bg-[var(--theme-bg)] text-white relative overflow-x-hidden">
      <Header />

      {/* 배경 글로우 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/10 blur-[70px] rounded-full pointer-events-none z-0" />

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
              시그널 현황
            </h1>
            <p className="text-gray-500 text-sm">수익률 랭킹과 실시간 시그널을 한눈에 확인하세요.</p>
          </div>

          {/* ── 수익률 랭킹 ── */}
          <div className="mb-12">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              수익률 랭킹
            </h2>
            <RankingSection />
          </div>

          {/* ── 실시간 시그널 현황 ── */}
          <SignalsSection />

        </div>
      </section>

      <Footer />
    </div>
  )
}
