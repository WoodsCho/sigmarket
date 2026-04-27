import { useState } from "react"
import { Info, AlertTriangle, Clock, Radio, ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSignals } from "../../hooks/useSignals"
import { SignalTableSkeleton } from "../ui/skeleton"
import type { Signal } from "../../types"

/* ─── 포지션 스타일 ─── */
const POS_STYLES: Record<string, { text: string; bg: string; border: string; bar: string; glow: string }> = {
  LONG:  { text: "text-cyan-400",  bg: "bg-cyan-400/10",  border: "border-cyan-400/25",  bar: "bg-cyan-500", glow: "shadow-cyan-500/20" },
  SHORT: { text: "text-pink-400",  bg: "bg-pink-400/10",  border: "border-pink-400/25",  bar: "bg-pink-500", glow: "shadow-pink-500/20" },
}

const PAGE_SIZE = 20

export default function Signals() {
  const { signals, isLoading, isLive } = useSignals()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  /* 간단한 통계 */
  const longCount = signals.filter(s => s.position === "LONG").length
  const shortCount = signals.filter(s => s.position === "SHORT").length

  const totalPages = Math.max(1, Math.ceil(signals.length / PAGE_SIZE))
  const pagedSignals = signals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <section id="signals" className="relative pt-32 pb-16">
      {/* bg glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/8 blur-[180px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          {/* ── 섹션 헤더 ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <p className="text-sm text-cyan-400 font-medium mb-3 uppercase tracking-wider">Live Signals</p>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => navigate("/signals")}
                  className="text-3xl lg:text-4xl font-bold text-white hover:text-gradient transition-all duration-300 cursor-pointer text-left"
                >
                  실시간 시그널 현황
                </button>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                  isLive
                    ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                    : "bg-gray-500/10 border border-gray-500/25 text-gray-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                  {isLive ? "Live" : "Demo"}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                시그마켓 인디케이터가 감지한 실시간 매매 시그널
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* 미니 통계 */}
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/15 text-[11px] font-semibold text-cyan-400">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  LONG {longCount}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/8 border border-pink-500/15 text-[11px] font-semibold text-pink-400">
                  <span className="w-1 h-1 rounded-full bg-pink-400" />
                  SHORT {shortCount}
                </span>
              </div>

              <a
                href="https://t.me/your_telegram_channel"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Radio className="w-4 h-4" />
                실시간 알림 받기
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10" />
              </a>
            </div>
          </div>

          {/* ── 로딩 ── */}
          {isLoading ? (
            <SignalTableSkeleton rows={5} />
          ) : (
            <div className="relative">
              {/* 테이블 외곽 글로우 */}
              <div className="absolute -inset-2 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 rounded-3xl blur-2xl pointer-events-none" />

              <div className="relative bg-[#0d1117] border border-gray-700/40 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">

                <div className="overflow-x-auto w-full bg-[#0d1117]">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#0f1420] text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-700/40">
                        <th className="px-5 py-3.5 font-semibold w-36">시각</th>
                        <th className="px-5 py-3.5 font-semibold">종목</th>
                        <th className="px-5 py-3.5 font-semibold">시그널 (지표)</th>
                        <th className="px-5 py-3.5 font-semibold">진입가</th>
                        <th className="px-5 py-3.5 font-semibold">포지션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/30 text-xs">
                      {pagedSignals.map((signal, idx) => (
                        <SignalRow key={signal.id || idx} signal={signal} idx={idx} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── 페이지네이션 ── */}
                {totalPages > 1 && (
                  <div className="bg-[#0a0e16] border-t border-gray-700/40 px-6 py-3 flex items-center justify-between">
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

                {/* ── 하단 안내 ── */}
                <div className="bg-[#0a0e16] border-t border-gray-700/40 p-5 px-6 flex flex-col gap-2.5">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-pink-500/10 mt-0.5 flex-shrink-0">
                      <Info className="w-3 h-3 text-pink-400" />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed break-keep">
                      포지션 종료는 상황에 따라 매우 달라지며, 본 "실시간 시그널 현황"에서는{" "}
                      <strong className="text-gray-300">포지션 종료(청산) 시점을 별도로 제공하지 않습니다.</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-gray-500/10 mt-0.5 flex-shrink-0">
                      <AlertTriangle className="w-3 h-3 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed break-keep">
                      실시간 시그널은 리딩이나 매매를 권장하는 것이 아니라 시그마켓 인디케이터의 기능을 안내하기 위해 제공되는 서비스이며, 시그널에 의한 매매의 손실은 책임지지 않습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function SignalRow({ signal, idx }: { signal: Signal; idx: number }) {
  const pos = POS_STYLES[signal.position] || POS_STYLES.LONG
  const baseSymbol = signal.symbol.split("/")[0]
  const isEven = idx % 2 === 0

  return (
    <tr
      className={`signal-row relative transition-all duration-200 group hover:bg-white/[0.03] ${isEven ? "bg-[#0d1117]" : "bg-[#0b0f16]"}`}
      style={{ animationDelay: `${idx * 0.03}s` }}
    >

      {/* ── 시각 ── */}
      <td className="relative px-5 py-3.5">
        {/* 포지션 컬러 바 */}
        <div className={`absolute inset-y-0 left-0 w-[2px] ${pos.bar} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
        {signal.isNew ? (
          <span className="inline-flex items-center gap-1.5 text-pink-400 font-semibold text-[11px] bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            방금 전
          </span>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3 h-3 shrink-0 text-gray-600" />
            <span className="text-[11px]">{signal.timeAgo || `${signal.date} ${signal.time}`}</span>
          </div>
        )}
      </td>

      {/* ── 종목 ── */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {/* 코인 아이콘 or 폴백 */}
          <div className="w-7 h-7 rounded-full bg-gray-800/80 border border-gray-700/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
            <img
              src={`https://assets.coincap.io/assets/icons/${baseSymbol.toLowerCase()}@2x.png`}
              alt={baseSymbol}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.target as HTMLImageElement
                el.style.display = "none"
                el.parentElement!.innerHTML = `<span class="text-[9px] font-bold text-gray-400">${baseSymbol.slice(0, 2)}</span>`
              }}
            />
          </div>
          <div>
            <div className="font-semibold text-gray-200 text-[13px] tracking-wide group-hover:text-white transition-colors">{signal.symbol}</div>
            {signal.exchange && (
              <div className="text-[10px] text-gray-600 mt-0.5">{signal.exchange}</div>
            )}
          </div>
        </div>
      </td>

      {/* ── 시그널 (지표) ── */}
      <td className="px-5 py-3.5">
        {signal.indicator && signal.indicator !== "—" ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 font-medium">
            {signal.indicator}
          </span>
        ) : (
          <span className="text-gray-700 text-[11px]">—</span>
        )}
      </td>

      {/* ── 진입가 ── */}
      <td className="px-5 py-3.5">
        <span className="font-mono text-[13px] text-gray-300 font-medium tabular-nums">{signal.price}</span>
      </td>

      {/* ── 포지션 ── */}
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider border ${pos.text} ${pos.bg} ${pos.border} group-hover:shadow-sm group-hover:${pos.glow} transition-shadow`}>
          {signal.position}
        </span>
      </td>
    </tr>
  )
}
