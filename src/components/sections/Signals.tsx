import { Badge } from "../ui/badge"
import { useSignals } from "../../hooks/useSignals"
import type { Signal } from "../../types"

export default function Signals() {
  const { signals, isLoading, isLive } = useSignals()

  return (
    <section id="signals" className="relative py-24">
      {/* Section bg glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.06)_0%,_transparent_70%)]" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <SignalHeader isLive={isLive} />
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-gray-500 mt-4 text-sm">시그널 로딩 중...</p>
            </div>
          ) : (
            <SignalTable signals={signals} />
          )}
          <div className="mt-6">
            <p className="text-gray-600 text-xs">
              시그마켓은 감정이 아닌 조건으로 매매합니다. 트레이딩뷰 기반 커스텀 인디케이터로 실시간 시그널을
              제공합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function SignalHeader({ isLive }: { isLive: boolean }) {
  return (
    <div className="mb-10">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm text-emerald-400 font-medium mb-3 uppercase tracking-wider">Live Signals</p>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            실시간 <span className="text-gradient">시그널</span> 현황
          </h2>
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-gray-500"}`} />
            <span className={`font-bold text-sm ${isLive ? "text-emerald-400" : "text-gray-400"}`}>
              {isLive ? "LIVE" : "DEMO"}
            </span>
            <span className="text-gray-500 text-sm">
              {isLive ? "TradingView에서 실시간으로 업데이트됩니다" : "조건 충족 시 실시간으로 업데이트됩니다"}
            </span>
          </div>
        </div>
        <TelegramButton />
      </div>
    </div>
  )
}

function TelegramButton() {
  return (
    <a
      href="#"
      className="flex items-center gap-2 bg-[#0088cc]/10 border border-[#0088cc]/30 hover:bg-[#0088cc]/20 text-[#0088cc] px-5 py-2.5 rounded-xl transition-all group flex-shrink-0 hover:shadow-lg hover:shadow-[#0088cc]/10"
      title="텔레그램으로 실시간 시그널 받기"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
      </svg>
      <span className="text-sm font-medium">실시간 알림</span>
    </a>
  )
}

function SignalTable({ signals }: { signals: Signal[] }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Gradient border top */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="text-left px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="text-right px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (USDT)</th>
              <th className="text-center px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal, idx) => (
              <SignalRow key={idx} signal={signal} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <tr
      className={`border-b border-white/5 hover:bg-white/[0.02] transition-all duration-300 ${
        signal.isNew ? "bg-emerald-500/[0.03]" : ""
      }`}
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="text-lg">{signal.icon}</span>
          <span className="font-bold text-white">{signal.symbol}</span>
          {signal.isNew && (
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-black font-bold px-2.5 py-0.5 text-[10px] animate-pulse border-0">
              NEW
            </Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="font-mono text-sm text-gray-500">
          {signal.date} {signal.time}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <span className="font-mono text-white font-semibold">{signal.price}</span>
      </td>
      <td className="px-6 py-5 text-center">
        <Badge
          className={
            signal.position === "LONG"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-4 py-1.5 hover:bg-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20 font-bold px-4 py-1.5 hover:bg-red-500/20"
          }
        >
          {signal.position}
        </Badge>
      </td>
    </tr>
  )
}
