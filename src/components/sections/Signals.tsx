import { Info, AlertTriangle } from "lucide-react"
import { useSignals } from "../../hooks/useSignals"
import type { Signal } from "../../types"

/* ─── 포지션 스타일 ─── */
const POS_STYLES: Record<string, { text: string; bg: string }> = {
  LONG: { text: "text-cyan-400", bg: "bg-cyan-400/10" },
  SHORT: { text: "text-purple-400", bg: "bg-purple-400/10" },
}

/* ─── 종목 도트 컬러 ─── */
function dotColor(signal: Signal) {
  if (signal.position === "SHORT") return "bg-purple-400"
  return "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
}

export default function Signals() {
  const { signals, isLoading, isLive } = useSignals()

  return (
    <section id="signals" className="relative py-12">
      {/* bg glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* ── 헤더 ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  실시간 시그널 현황
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-pink-500/10 border border-pink-500/30 text-pink-500 text-xs font-bold tracking-wider uppercase">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-pink-500 animate-pulse" : "bg-gray-500"}`} />
                  {isLive ? "Live" : "Demo"}
                </span>
              </div>
              <p className="text-gray-400 text-sm">시그마 시스템이 시장의 파동을 실시간으로 추적하여 타점을 제시합니다.</p>
            </div>
          </div>

          {/* ── 로딩 ── */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block h-10 w-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <p className="text-gray-500 mt-4 text-sm">시그널 로딩 중...</p>
            </div>
          ) : (
            /* ── 테이블 카드 ── */
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden relative">
              {/* 상단 그라디언트 라인 */}
              <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-800">
                      <th className="px-6 py-4 font-semibold w-32">실시간 알림</th>
                      <th className="px-6 py-4 font-semibold">종목</th>
                      <th className="px-6 py-4 font-semibold">거래소</th>
                      <th className="px-6 py-4 font-semibold">시그널 (지표)</th>
                      <th className="px-6 py-4 font-semibold">진입</th>
                      <th className="px-6 py-4 font-semibold">포지션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 text-sm">
                    {signals.map((signal, idx) => (
                      <SignalRow key={signal.id || idx} signal={signal} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── 하단 안내 ── */}
              <div className="bg-gray-900/80 border-t border-gray-800 p-5 px-6 flex flex-col gap-2">
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
      </div>
    </section>
  )
}

function SignalRow({ signal }: { signal: Signal }) {
  const pos = POS_STYLES[signal.position] || POS_STYLES.LONG
  const dot = dotColor(signal)

  return (
    <tr className={`hover:bg-gray-800/40 transition-colors group ${signal.isNew ? "bg-gray-800/20" : ""}`}>
      {/* 실시간 알림 */}
      <td className="px-6 py-4">
        {signal.isNew ? (
          <span className="text-pink-400 font-bold text-xs bg-pink-400/10 px-2 py-1 rounded animate-pulse">
            {signal.timeAgo || "방금 전"}
          </span>
        ) : (
          <span className="text-gray-500 text-xs font-medium">{signal.timeAgo || `${signal.date} ${signal.time}`}</span>
        )}
      </td>
      {/* 종목 */}
      <td className="px-6 py-4 font-bold text-white">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          {signal.symbol}
        </div>
      </td>
      {/* 거래소 */}
      <td className="px-6 py-4 text-gray-300">{signal.exchange || "—"}</td>
      {/* 시그널 (지표) */}
      <td className="px-6 py-4 text-gray-300">
        <span className="px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300">
          {signal.indicator || "—"}
        </span>
      </td>
      {/* 진입 */}
      <td className="px-6 py-4 font-mono text-gray-300">{signal.price}</td>
      {/* 포지션 */}
      <td className="px-6 py-4">
        <span className={`${pos.text} font-bold ${pos.bg} px-2 py-1 rounded`}>{signal.position}</span>
      </td>
    </tr>
  )
}
