import { useState, useMemo } from "react"
import { ArrowLeft, Info, AlertTriangle, TrendingUp, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Header, Footer } from "../components/sections"
import { useSignals } from "../hooks/useSignals"
import { dummyRankings } from "../data"
import type { Signal, RankingEntry } from "../types"
import FreeTrialModal from "../components/FreeTrialModal"

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
  const { signals } = useSignals()

  const rankings = useMemo(() => {
    const now = Date.now()
    const cutoffMs: Record<Period, number> = {
      daily:   1 * 86400 * 1000,
      weekly:  7 * 86400 * 1000,
      monthly: 30 * 86400 * 1000,
    }
    const ms = cutoffMs[period]

    const closed = signals.filter((s) => {
      if (s.profitRate == null) return false
      if (s.createdAt && now - new Date(s.createdAt).getTime() > ms) return false
      return true
    })

    if (closed.length === 0) return dummyRankings   // 데이터 없으면 더미

    return closed
      .sort((a, b) => parseFloat(b.profitRate ?? "0") - parseFloat(a.profitRate ?? "0"))
      .slice(0, 10)
      .map((s, i): RankingEntry => ({
        rank: i + 1,
        symbol: s.symbol,
        signal: s.indicator || "—",
        entryPrice: s.price,
        entryDate: `${s.date ?? ""} ${s.time ?? ""}`.trim(),
        resultPrice: s.exitPrice || "—",
        position: s.position,
        returnPct: parseFloat(s.profitRate ?? "0"),
        color: s.position === "SHORT" ? "pink" : "cyan",
      }))
  }, [signals, period])

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
              <th className="hidden sm:table-cell px-4 py-2.5 font-semibold">시그널</th>
              <th className="px-4 py-2.5 font-semibold">진입가</th>
              <th className="hidden md:table-cell px-4 py-2.5 font-semibold">진입시각</th>
              <th className="hidden md:table-cell px-4 py-2.5 font-semibold">성과가</th>
              <th className="hidden sm:table-cell px-4 py-2.5 font-semibold">포지션</th>
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
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          if (!el.dataset.fallback) {
                            el.dataset.fallback = "1"
                            el.src = `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/32/color/${baseSymbol}.png`
                          } else {
                            el.style.display = "none"
                          }
                        }}
                      />
                      <div className="flex flex-col leading-tight">
                        <span>{entry.symbol.split("/")[0]}</span>
                        {/* 모바일: 포지션 배지 아래 표시 */}
                        <span className={`sm:hidden text-[9px] font-bold ${pos.text} mt-0.5`}>{entry.position}</span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <span className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/40 text-[10px] text-gray-400">
                      {entry.signal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{entry.entryPrice}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-500 text-[11px]">{entry.entryDate}</td>
                  <td className="hidden md:table-cell px-4 py-3 font-medium text-gray-300">{entry.resultPrice}</td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <span className={`${pos.text} font-bold ${pos.bg} px-1.5 py-0.5 rounded text-[10px]`}>
                      {entry.position}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold text-sm ${retCol}`}>
                    {entry.returnPct >= 0 ? "+" : ""}{entry.returnPct.toFixed(2)}%
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
  const baseSymbol = signal.symbol.split("/")[0]
    .replace(/USDT\.?P?$/i, "")
    .replace(/(BTC|ETH|BNB|BUSD|USD|PERP)$/i, "")

  const shortTimeAgo = signal.timeAgo
    ? signal.timeAgo
        .replace(/(\d+)일 전/, "$1d")
        .replace(/(\d+)시간 전/, "$1h")
        .replace(/(\d+)분 전/, "$1m")
        .replace(/(\d+)초 전/, "$1s")
    : signal.date

  return (
    <tr className="bg-[#0d1117] hover:bg-gray-800/30 transition-colors group">
      {/* 시각 */}
      <td className="px-3 md:px-6 py-2.5 md:py-3 relative">
        <div className={`absolute inset-y-0 left-0 w-[2px] ${pos.text.replace("text-", "bg-")} opacity-0 group-hover:opacity-100 transition-opacity`} />
        {signal.isNew && (!signal.timeAgo || signal.timeAgo === "방금 전") ? (
          <span className="inline-flex items-center gap-1 text-yellow-400 font-semibold text-[11px] bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="hidden sm:inline">방금 전</span>
            <span className="sm:hidden">NOW</span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3 h-3 shrink-0 text-gray-600" />
            <span className="text-[11px] sm:hidden">{shortTimeAgo}</span>
            <span className="text-[11px] hidden sm:inline">{signal.timeAgo || `${signal.date} ${signal.time}`}</span>
          </div>
        )}
      </td>
      {/* 종목 */}
      <td className="px-3 md:px-6 py-2.5 md:py-3 font-bold text-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-800/80 border border-gray-700/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
            <img
              src={`https://assets.coincap.io/assets/icons/${baseSymbol.toLowerCase()}@2x.png`}
              alt={baseSymbol}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.target as HTMLImageElement
                if (!el.dataset.fallback) {
                  el.dataset.fallback = "1"
                  el.src = `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/32/color/${baseSymbol.toLowerCase()}.png`
                } else {
                  el.style.display = "none"
                  el.parentElement!.innerHTML = `<span class="text-[8px] font-bold text-gray-500">${baseSymbol.slice(0,2).toUpperCase()}</span>`
                }
              }}
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-bold text-gray-200">{signal.symbol.split("/")[0]}</span>
            {/* 모바일: 포지션 아래 표시 */}
            <span className={`sm:hidden text-[9px] font-bold ${pos.text} mt-0.5`}>{signal.position}</span>
          </div>
        </div>
      </td>
      {/* 시그널(지표) - 데스크탑만 */}
      <td className="hidden md:table-cell px-6 py-3 text-gray-300">
        <span className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/40 text-[10px] text-gray-400">
          {signal.indicator || "—"}
        </span>
      </td>
      {/* 진입가 */}
      <td className="px-3 md:px-6 py-2.5 md:py-3 text-gray-400 font-mono text-[12px]">{signal.price}</td>
      {/* 포지션 - sm 이상만 */}
      <td className="hidden sm:table-cell px-6 py-3">
        <span className={`${pos.text} font-bold ${pos.bg} px-1.5 py-0.5 rounded text-[10px]`}>{signal.position}</span>
      </td>
    </tr>
  )
}

/* ─── 실시간 시그널 섹션 ─── */
const PAGE_SIZE = 20

function SignalsSection({ onOpenTrial }: { onOpenTrial: () => void }) {
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
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
            isLive
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
              : "bg-gray-500/10 border border-gray-500/25 text-gray-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
            {isLive ? "Live" : "Demo"}
          </span>
          {/* 모바일: 타이틀 옆 텔레그램 버튼 */}
          <button
            onClick={onOpenTrial}
            className="sm:hidden group relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#229ED9] text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#229ED9]/30 hover:scale-[1.06] active:scale-[0.97] shrink-0"
            title="텔레그램 알림 받기"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </button>
        </div>
        {/* 데스크탑: 오른쪽 텔레그램 버튼 */}
        <button
          onClick={onOpenTrial}
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1a8fc4] text-white font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-[#229ED9]/40 hover:scale-[1.02]"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          3일동안 알림받기(free)
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block h-10 w-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 mt-4 text-sm">시그널 로딩 중...</p>
        </div>
      ) : (
        <div className="bg-[#0d1117] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto w-full bg-[#0d1117] custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap font-mono">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#161b22] text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-700/50">
                  <th className="px-3 md:px-6 py-2.5 font-semibold w-20 md:w-32">시각</th>
                  <th className="px-3 md:px-6 py-2.5 font-semibold">종목</th>
                  <th className="hidden md:table-cell px-6 py-2.5 font-semibold">시그널 (지표)</th>
                  <th className="px-3 md:px-6 py-2.5 font-semibold">진입가</th>
                  <th className="hidden sm:table-cell px-6 py-2.5 font-semibold">포지션</th>
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
            <div className="bg-[#0a0e16] border-t border-gray-700/50 px-4 py-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-2 py-1 rounded-lg text-[11px] text-gray-500 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono"
              >«</button>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => Math.abs(i - page) <= 2)
                .map((i, arrIdx, arr) => (
                  <>
                    {arrIdx > 0 && arr[arrIdx - 1] !== i - 1 && (
                      <span key={`e-${i}`} className="text-gray-600 text-[11px] px-0.5">…</span>
                    )}
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-7 h-7 rounded-lg text-[11px] font-mono transition-colors ${
                        i === page
                          ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold"
                          : "text-gray-500 hover:text-white hover:bg-gray-700/50"
                      }`}
                    >{i + 1}</button>
                  </>
                ))
              }
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page === totalPages - 1}
                className="px-2 py-1 rounded-lg text-[11px] text-gray-500 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono"
              >»</button>
              <span className="text-[11px] text-gray-500 font-mono ml-1">{page + 1}/{totalPages}</span>
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
  const [trialOpen, setTrialOpen] = useState(false)

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
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-cyan-400 shrink-0" />
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                수익률 랭킹
              </h2>
            </div>
            <RankingSection />
          </div>

          {/* ── 섹션 구분선 ── */}
          <div className="relative flex items-center mb-12">
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gray-400/90 to-transparent" />
          </div>

          {/* ── 실시간 시그널 현황 ── */}
          <SignalsSection onOpenTrial={() => setTrialOpen(true)} />

        </div>
      </section>

      <FreeTrialModal open={trialOpen} onClose={() => setTrialOpen(false)} />
      <Footer />
    </div>
  )
}
