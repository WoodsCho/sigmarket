import { Info, AlertTriangle } from "lucide-react"
import { useSignals } from "../../hooks/useSignals"
import type { Signal } from "../../types"

/* ─── 포지션 스타일 ─── */
const POS_STYLES: Record<string, { text: string; bg: string }> = {
  LONG: { text: "text-cyan-400", bg: "bg-cyan-400/10" },
  SHORT: { text: "text-pink-500", bg: "bg-pink-500/10" },
}

export default function Signals() {
  const { signals, isLoading, isLive } = useSignals()

  return (
    <section id="signals" className="relative pt-40 pb-12">
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
            <div className="bg-[#0d1117] border border-gray-700/50 rounded-md shadow-2xl overflow-hidden">

              <div className="overflow-x-auto w-full bg-[#0d1117]">
                <table className="w-full text-left border-collapse whitespace-nowrap font-mono">
                  <thead>
                    <tr className="bg-[#161b22] text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-700/50">
                      <th className="px-6 py-2.5 font-semibold w-32">실시간 알림</th>
                      <th className="px-6 py-2.5 font-semibold">종목</th>
                      <th className="px-6 py-2.5 font-semibold">거래소</th>
                      <th className="px-6 py-2.5 font-semibold">시그널 (지표)</th>
                      <th className="px-6 py-2.5 font-semibold">진입</th>
                      <th className="px-6 py-2.5 font-semibold">포지션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/30 text-xs">
                    {signals.map((signal, idx) => (
                      <SignalRow key={signal.id || idx} signal={signal} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── 하단 안내 ── */}
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
      </div>
    </section>
  )
}

function SignalRow({ signal }: { signal: Signal }) {
  const pos = POS_STYLES[signal.position] || POS_STYLES.LONG

  return (
    <tr className="bg-[#0d1117] hover:bg-gray-800/30 transition-colors group">
      {/* 실시간 알림 */}
      <td className="px-6 py-3">
        {signal.isNew ? (
          <span className="text-pink-400 font-bold text-xs bg-pink-400/10 px-2 py-1 rounded animate-pulse">
            {signal.timeAgo || "방금 전"}
          </span>
        ) : (
          <span className="text-gray-500 text-xs font-medium">{signal.timeAgo || `${signal.date} ${signal.time}`}</span>
        )}
      </td>
      {/* 종목 */}
      <td className="px-6 py-3 font-bold text-gray-300">
        <div className="flex items-center gap-2">
          <img
            src={`https://assets.coincap.io/assets/icons/${signal.symbol.split("/")[0].toLowerCase()}@2x.png`}
            alt={signal.symbol.split("/")[0]}
            className="w-4 h-4 rounded-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
          {signal.symbol}
        </div>
      </td>
      {/* 거래소 */}
      <td className="px-6 py-3 text-gray-400">{signal.exchange || "—"}</td>
      {/* 시그널 (지표) */}
      <td className="px-6 py-3 text-gray-300">
        <span className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/40 text-[10px] text-gray-400">
          {signal.indicator || "—"}
        </span>
      </td>
      {/* 진입 */}
      <td className="px-6 py-3 text-gray-400">{signal.price}</td>
      {/* 포지션 */}
      <td className="px-6 py-3">
        <span className={`${pos.text} font-bold ${pos.bg} px-1.5 py-0.5 rounded text-[10px]`}>{signal.position}</span>
      </td>
    </tr>
  )
}
