import { useEffect, useRef, useState, useCallback } from "react"
import { createChart, createSeriesMarkers, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type Time, ColorType } from "lightweight-charts"

/* ─── 전략 정의 ─── */
interface Strategy {
  id: string
  name: string
  description: string
  color: string
  activeColor: string
  borderColor: string
}

/* ─── 종목 & 인터벌 정의 ─── */
interface SymbolOption {
  symbol: string
  label: string
  category: "crypto" | "forex"
}

const symbols: SymbolOption[] = [
  { symbol: "BTCUSDT", label: "BTC/USDT", category: "crypto" },
  { symbol: "ETHUSDT", label: "ETH/USDT", category: "crypto" },
  { symbol: "SOLUSDT", label: "SOL/USDT", category: "crypto" },
  { symbol: "BNBUSDT", label: "BNB/USDT", category: "crypto" },
  { symbol: "XRPUSDT", label: "XRP/USDT", category: "crypto" },
  { symbol: "DOGEUSDT", label: "DOGE/USDT", category: "crypto" },
  { symbol: "ADAUSDT", label: "ADA/USDT", category: "crypto" },
  { symbol: "AVAXUSDT", label: "AVAX/USDT", category: "crypto" },
  { symbol: "DOTUSDT", label: "DOT/USDT", category: "crypto" },
  { symbol: "LINKUSDT", label: "LINK/USDT", category: "crypto" },
]

const intervals = [
  { id: "15m", label: "15분" },
  { id: "1h", label: "1시간" },
  { id: "4h", label: "4시간" },
  { id: "1d", label: "1일" },
]

const strategies: Strategy[] = [
  {
    id: "sigma-box",
    name: "Sigma Box",
    description: "듀얼 박스 구조 + 브레이크아웃",
    color: "text-emerald-400",
    activeColor: "bg-emerald-500/20 border-emerald-500/40",
    borderColor: "border-emerald-500/20",
  },
  {
    id: "super-target",
    name: "슈퍼타겟",
    description: "추세 방향 고정 + 횡보 필터",
    color: "text-cyan-400",
    activeColor: "bg-cyan-500/20 border-cyan-500/40",
    borderColor: "border-cyan-500/20",
  },
  {
    id: "order-block",
    name: "Order Block",
    description: "기관 매집 구간 탐지",
    color: "text-purple-400",
    activeColor: "bg-purple-500/20 border-purple-500/40",
    borderColor: "border-purple-500/20",
  },
  {
    id: "rsi-bb",
    name: "RSI + BB",
    description: "선행 시그널 조합",
    color: "text-orange-400",
    activeColor: "bg-orange-500/20 border-orange-500/40",
    borderColor: "border-orange-500/20",
  },
]

/* ─── 거래 결과 타입 ─── */
interface TradeResult {
  buyTime: Time
  sellTime: Time
  buyPrice: number
  sellPrice: number
  pnl: number // 수익률 %
}

/* ─── 시그널 생성 결과 ─── */
interface SignalResult {
  markers: Array<{
    time: Time
    position: "aboveBar" | "belowBar"
    color: string
    shape: "arrowUp" | "arrowDown"
    text: string
    size: number
  }>
  trades: TradeResult[]
}

/* ─── 전략별 시그널 생성 (Buy→Sell 교대) ─── */
function generateSignals(candles: CandlestickData<Time>[], strategyId: string): SignalResult {
  const markers: SignalResult["markers"] = []
  const trades: TradeResult[] = []

  if (candles.length < 30) return { markers, trades }

  let inPosition = false  // 현재 포지션 보유 여부
  let entryPrice = 0
  let entryTime: Time = 0 as Time

  for (let i = 20; i < candles.length; i++) {
    const c = candles[i]
    const prev = candles[i - 1]

    let buyCondition = false
    let sellCondition = false

    switch (strategyId) {
      case "sigma-box": {
        const high20 = Math.max(...candles.slice(i - 20, i).map(x => x.high))
        const low20 = Math.min(...candles.slice(i - 20, i).map(x => x.low))
        buyCondition = c.close > high20 && prev.close <= high20
        sellCondition = c.close < low20 && prev.close >= low20
        break
      }
      case "super-target": {
        const avg5 = candles.slice(i - 5, i).reduce((s, x) => s + x.close, 0) / 5
        const avg5prev = candles.slice(i - 6, i - 1).reduce((s, x) => s + x.close, 0) / 5
        const avg20 = candles.slice(i - 20, i).reduce((s, x) => s + x.close, 0) / 20
        buyCondition = avg5 > avg20 && avg5prev <= avg20
        sellCondition = avg5 < avg20 && avg5prev >= avg20
        break
      }
      case "order-block": {
        const bodySize = Math.abs(c.close - c.open)
        const avgBody = candles.slice(i - 10, i).reduce((s, x) => s + Math.abs(x.close - x.open), 0) / 10
        buyCondition = prev.close < prev.open && bodySize > avgBody * 2 && c.close > c.open && c.close > prev.open
        sellCondition = prev.close > prev.open && bodySize > avgBody * 2 && c.close < c.open && c.close < prev.open
        break
      }
      case "rsi-bb": {
        const gains: number[] = []
        const losses: number[] = []
        for (let j = i - 13; j <= i; j++) {
          const diff = candles[j].close - candles[j - 1].close
          gains.push(diff > 0 ? diff : 0)
          losses.push(diff < 0 ? -diff : 0)
        }
        const avgGain = gains.reduce((a, b) => a + b, 0) / 14
        const avgLoss = losses.reduce((a, b) => a + b, 0) / 14
        const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
        const prevGains: number[] = []
        const prevLosses: number[] = []
        for (let j = i - 14; j <= i - 1; j++) {
          const diff = candles[j].close - candles[j - 1].close
          prevGains.push(diff > 0 ? diff : 0)
          prevLosses.push(diff < 0 ? -diff : 0)
        }
        const prevAvgGain = prevGains.reduce((a, b) => a + b, 0) / 14
        const prevAvgLoss = prevLosses.reduce((a, b) => a + b, 0) / 14
        const prevRsi = prevAvgLoss === 0 ? 100 : 100 - 100 / (1 + prevAvgGain / prevAvgLoss)
        buyCondition = prevRsi < 30 && rsi >= 30
        sellCondition = prevRsi > 70 && rsi <= 70
        break
      }
    }

    // Buy → Sell 교대 방식: 포지션 없을 때만 Buy, 있을 때만 Sell
    if (!inPosition && buyCondition) {
      inPosition = true
      entryPrice = c.close
      entryTime = c.time
      markers.push({
        time: c.time,
        position: "belowBar",
        color: "#10b981",
        shape: "arrowUp",
        text: "◉ BUY",
        size: 3,
      })
    } else if (inPosition && sellCondition) {
      const pnl = ((c.close - entryPrice) / entryPrice) * 100
      inPosition = false
      trades.push({
        buyTime: entryTime,
        sellTime: c.time,
        buyPrice: entryPrice,
        sellPrice: c.close,
        pnl,
      })
      markers.push({
        time: c.time,
        position: "aboveBar",
        color: pnl >= 0 ? "#10b981" : "#ef4444",
        shape: "arrowDown",
        text: `${pnl >= 0 ? "▲" : "▼"} ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`,
        size: 3,
      })
    }
  }

  return { markers, trades }
}

/* ─── 메인 컴포넌트 ─── */
export default function StrategyChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null)
  const candlesRef = useRef<CandlestickData<Time>[]>([])
  const [activeStrategy, setActiveStrategy] = useState("sigma-box")
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT")
  const [activeInterval, setActiveInterval] = useState("1h")
  const [signalCount, setSignalCount] = useState({ buy: 0, sell: 0 })
  const [tradeStats, setTradeStats] = useState({ trades: 0, winRate: 0, totalPnl: 0, avgPnl: 0, wins: 0, losses: 0 })
  const [tradeList, setTradeList] = useState<TradeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)
  const activeStrategyRef = useRef(activeStrategy)

  // 데이터 fetch 함수
  const fetchCandles = useCallback((sym: string, interval: string, strategy: string) => {
    if (!seriesRef.current) return
    setIsLoading(true)

    fetch(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(sym)}&interval=${encodeURIComponent(interval)}&limit=200`)
      .then((res) => res.json())
      .then((data: unknown[]) => {
        if (!seriesRef.current) return
        const candles: CandlestickData<Time>[] = (data as number[][]).map((d) => ({
          time: (d[0] / 1000) as Time,
          open: parseFloat(String(d[1])),
          high: parseFloat(String(d[2])),
          low: parseFloat(String(d[3])),
          close: parseFloat(String(d[4])),
        }))
        candlesRef.current = candles
        seriesRef.current.setData(candles)

        const result = generateSignals(candles, strategy)
        markersRef.current?.setMarkers(result.markers)
        applyTradeStats(result)

        chartRef.current?.timeScale().fitContent()
      })
      .catch(() => {
        if (!seriesRef.current) return
        const demoCandles = generateDemoCandles()
        candlesRef.current = demoCandles
        seriesRef.current.setData(demoCandles)
        const result = generateSignals(demoCandles, strategy)
        markersRef.current?.setMarkers(result.markers)
        applyTradeStats(result)
        chartRef.current?.timeScale().fitContent()
      })
      .finally(() => setIsLoading(false))
  }, [])

  // 차트 생성
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0f1a" },
        textColor: "#6b7280",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(16,185,129,0.3)", labelBackgroundColor: "#10b981" },
        horzLine: { color: "rgba(16,185,129,0.3)", labelBackgroundColor: "#10b981" },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.05)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.05)",
      },
      handleScroll: false,
      handleScale: false,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    })

    chartRef.current = chart
    seriesRef.current = candleSeries
    markersRef.current = createSeriesMarkers(candleSeries)

    fetchCandles("BTCUSDT", "1h", "sigma-box")

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [fetchCandles])

  // 거래 통계 업데이트 헬퍼
  const applyTradeStats = useCallback((result: SignalResult) => {
    setSignalCount({
      buy: result.markers.filter((m) => m.shape === "arrowUp").length,
      sell: result.markers.filter((m) => m.shape === "arrowDown").length,
    })
    setTradeList(result.trades)
    const wins = result.trades.filter((t) => t.pnl >= 0).length
    const losses = result.trades.filter((t) => t.pnl < 0).length
    const totalPnl = result.trades.reduce((s, t) => s + t.pnl, 0)
    setTradeStats({
      trades: result.trades.length,
      winRate: result.trades.length > 0 ? (wins / result.trades.length) * 100 : 0,
      totalPnl,
      avgPnl: result.trades.length > 0 ? totalPnl / result.trades.length : 0,
      wins,
      losses,
    })
  }, [])

  // 전략 변경 시 마커 업데이트
  const updateStrategy = useCallback((strategyId: string) => {
    setActiveStrategy(strategyId)
    activeStrategyRef.current = strategyId
    if (!seriesRef.current || candlesRef.current.length === 0) return

    const result = generateSignals(candlesRef.current, strategyId)
    markersRef.current?.setMarkers(result.markers)
    applyTradeStats(result)
  }, [applyTradeStats])

  // 종목 변경
  const updateSymbol = useCallback((sym: string) => {
    setActiveSymbol(sym)
    setShowSymbolDropdown(false)
    fetchCandles(sym, activeInterval, activeStrategyRef.current)
  }, [activeInterval, fetchCandles])

  // 인터벌 변경
  const updateInterval = useCallback((interval: string) => {
    setActiveInterval(interval)
    fetchCandles(activeSymbol, interval, activeStrategyRef.current)
  }, [activeSymbol, fetchCandles])

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    if (!showSymbolDropdown) return
    const handleClick = () => setShowSymbolDropdown(false)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [showSymbolDropdown])

  return (
    <div className="mb-16">
      <div className="gradient-border overflow-hidden">
        <div className="bg-[#0a0f1a] rounded-2xl overflow-hidden">
          {/* 종목 & 인터벌 선택 */}
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 종목 드롭다운 */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:border-emerald-500/30 transition-all text-sm font-semibold text-white"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {symbols.find((s) => s.symbol === activeSymbol)?.label ?? activeSymbol}
                  <svg className={`w-3 h-3 text-gray-500 transition-transform ${showSymbolDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showSymbolDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 py-1 rounded-xl border border-white/10 bg-[#0d1321] shadow-2xl z-50 max-h-64 overflow-y-auto">
                    {symbols.map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => updateSymbol(s.symbol)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                          activeSymbol === s.symbol
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{s.label}</span>
                        {activeSymbol === s.symbol && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 구분선 */}
              <div className="h-6 w-px bg-white/10" />

              {/* 인터벌 선택 */}
              <div className="flex items-center gap-1">
                {intervals.map((iv) => (
                  <button
                    key={iv.id}
                    onClick={() => updateInterval(iv.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeInterval === iv.id
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-gray-500 hover:text-gray-300 border border-transparent"
                    }`}
                  >
                    {iv.label}
                  </button>
                ))}
              </div>

              {/* 로딩 표시 */}
              {isLoading && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="h-3 w-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  로딩중...
                </div>
              )}
            </div>
          </div>

          {/* 전략 선택 탭 */}
          <div className="p-4 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mr-2">전략 선택</span>
                {strategies.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateStrategy(s.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 ${
                      activeStrategy === s.id
                        ? `${s.activeColor} ${s.color}`
                        : "border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Buy: {signalCount.buy}
                </span>
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Sell: {signalCount.sell}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-600 mt-2">
              {strategies.find((s) => s.id === activeStrategy)?.description}
              <span className="ml-2 text-gray-700">· BINANCE:{activeSymbol} · {activeInterval.toUpperCase()}</span>
            </p>
          </div>

          {/* 차트 영역 */}
          <div ref={chartContainerRef} style={{ height: "600px", width: "100%" }} />

          {/* 하단 거래 통계 */}
          <div className="p-4 border-t border-white/5 bg-white/[0.02]">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">총 거래</p>
                <p className="text-lg font-bold text-white">{tradeStats.trades}<span className="text-xs text-gray-500 ml-1">회</span></p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">승률</p>
                <p className={`text-lg font-bold ${tradeStats.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                  {tradeStats.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">총 수익률</p>
                <p className={`text-lg font-bold ${tradeStats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tradeStats.totalPnl >= 0 ? "+" : ""}{tradeStats.totalPnl.toFixed(2)}%
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">평균 수익률</p>
                <p className={`text-lg font-bold ${tradeStats.avgPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tradeStats.avgPnl >= 0 ? "+" : ""}{tradeStats.avgPnl.toFixed(2)}%
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">승/패</p>
                <p className="text-lg font-bold">
                  <span className="text-emerald-400">{tradeStats.wins}</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="text-red-400">{tradeStats.losses}</span>
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">시그널</p>
                <p className="text-lg font-bold">
                  <span className="text-emerald-400">{signalCount.buy}</span>
                  <span className="text-gray-600 text-xs mx-1">Buy</span>
                  <span className="text-red-400 ml-1">{signalCount.sell}</span>
                  <span className="text-gray-600 text-xs mx-1">Sell</span>
                </p>
              </div>
            </div>

            {/* 거래 내역 테이블 */}
            {tradeList.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-white/5">
                <table className="w-full text-xs">
                  <thead className="bg-white/[0.03] sticky top-0">
                    <tr className="text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-semibold">#</th>
                      <th className="text-left px-3 py-2 font-semibold">진입가</th>
                      <th className="text-left px-3 py-2 font-semibold">청산가</th>
                      <th className="text-right px-3 py-2 font-semibold">수익률</th>
                      <th className="text-right px-3 py-2 font-semibold">결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeList.map((t, idx) => (
                      <tr key={idx} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 text-gray-300 font-mono">{t.buyPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-gray-300 font-mono">{t.sellPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className={`px-3 py-2 text-right font-mono font-semibold ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.pnl >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          }`}>
                            {t.pnl >= 0 ? "WIN" : "LOSS"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <p className="text-[11px] text-gray-600">
                Buy → Sell 교대 방식 · 포지션당 1회 진입/청산
              </p>
              <span className="text-[10px] text-gray-700">Powered by Lightweight Charts™</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── 데모 캔들 데이터 (API 실패 시) ─── */
function generateDemoCandles(): CandlestickData<Time>[] {
  const candles: CandlestickData<Time>[] = []
  let price = 68000
  const now = Math.floor(Date.now() / 1000)
  for (let i = 0; i < 200; i++) {
    const time = (now - (200 - i) * 3600) as Time
    const change = (Math.random() - 0.48) * 800
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * 400
    const low = Math.min(open, close) - Math.random() * 400
    candles.push({ time, open, high, low, close })
    price = close
  }
  return candles
}
