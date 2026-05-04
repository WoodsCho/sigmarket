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
    color: "text-cyan-400",
    activeColor: "bg-cyan-500/20 border-cyan-500/40",
    borderColor: "border-cyan-500/20",
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

/* ─── API URL ─── */
const SIGNALS_API_URL = import.meta.env.VITE_INDICATORS_API_URL
  || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/indicators` : "")

/* ─── 서버 시그널 실행 API 호출 ─── */
async function fetchSignals(candles: Array<{ time: Time; open: number; high: number; low: number; close: number }>, strategyId: string): Promise<SignalResult> {
  if (!SIGNALS_API_URL) return { markers: [], trades: [] }
  try {
    const res = await fetch(SIGNALS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "signals", strategyId, candles }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn("시그널 API 호출 실패:", err)
    return { markers: [], trades: [] }
  }
}

/* ─── 메인 컴포넌트 ─── */
interface StrategyChartProps {
  fixedStrategyId?: string
}

export default function StrategyChart({ fixedStrategyId }: StrategyChartProps = {}) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null)
  const candlesRef = useRef<CandlestickData<Time>[]>([])
  const isFetchingRef = useRef(false)  // 과거 데이터 로딩 중복 방지
  const signalResultRef = useRef<SignalResult>({ markers: [], trades: [] })  // 전체 시그널 결과
  const activeSymbolRef = useRef("BTCUSDT")
  const activeIntervalRef = useRef("1h")
  const [activeStrategy, setActiveStrategy] = useState(fixedStrategyId || "sigma-box")
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT")
  const [activeInterval, setActiveInterval] = useState("1h")
  const [signalCount, setSignalCount] = useState({ buy: 0, sell: 0 })
  const [, setTradeStats] = useState({ trades: 0, winRate: 0, totalPnl: 0, avgPnl: 0, wins: 0, losses: 0 })
  const [, setTradeList] = useState<TradeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)
  const isEmbedded = !!fixedStrategyId
  const activeStrategyRef = useRef(activeStrategy)

  // 인터벌별 최적 봉 수 (Binance 최대 1000)
  const getCandleLimit = (interval: string) => {
    switch (interval) {
      case "15m": return 1000  // ~10일
      case "1h":  return 720   // ~30일
      case "4h":  return 500   // ~83일
      case "1d":  return 365   // ~1년
      default:    return 500
    }
  }

  // 데이터 fetch 함수
  const fetchCandles = useCallback((sym: string, interval: string, strategy: string) => {
    if (!seriesRef.current) return
    setIsLoading(true)
    activeSymbolRef.current = sym
    activeIntervalRef.current = interval
    const limit = getCandleLimit(interval)

    fetch(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(sym)}&interval=${encodeURIComponent(interval)}&limit=${limit}`)
      .then((res) => res.json())
      .then(async (data: unknown[]) => {
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

        const result = await fetchSignals(candles, strategy)
        markersRef.current?.setMarkers(result.markers)
        applyTradeStats(result)

        chartRef.current?.timeScale().fitContent()
      })
      .catch(async () => {
        if (!seriesRef.current) return
        const demoCandles = generateDemoCandles()
        candlesRef.current = demoCandles
        seriesRef.current.setData(demoCandles)
        const result = await fetchSignals(demoCandles, strategy)
        markersRef.current?.setMarkers(result.markers)
        applyTradeStats(result)
        chartRef.current?.timeScale().fitContent()
      })
      .finally(() => setIsLoading(false))
  }, [])

  // 과거 데이터 추가 로딩 (무한 스크롤)
  const fetchOlderCandles = useCallback(() => {
    if (isFetchingRef.current || candlesRef.current.length === 0 || !seriesRef.current) return
    isFetchingRef.current = true
    setIsLoading(true)

    const oldest = candlesRef.current[0]
    const endTime = (oldest.time as number) * 1000 - 1  // 기존 첫 봉 직전까지
    const sym = activeSymbolRef.current
    const interval = activeIntervalRef.current
    const limit = 500

    fetch(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(sym)}&interval=${encodeURIComponent(interval)}&limit=${limit}&endTime=${endTime}`)
      .then((res) => res.json())
      .then(async (data: unknown[]) => {
        if (!seriesRef.current || !Array.isArray(data) || data.length === 0) return
        const olderCandles: CandlestickData<Time>[] = (data as number[][]).map((d) => ({
          time: (d[0] / 1000) as Time,
          open: parseFloat(String(d[1])),
          high: parseFloat(String(d[2])),
          low: parseFloat(String(d[3])),
          close: parseFloat(String(d[4])),
        }))

        // 기존 데이터 앞에 추가 (중복 제거)
        const existingTimes = new Set(candlesRef.current.map(c => c.time))
        const newCandles = olderCandles.filter(c => !existingTimes.has(c.time))
        if (newCandles.length === 0) return

        const merged = [...newCandles, ...candlesRef.current]
        candlesRef.current = merged
        seriesRef.current.setData(merged)

        // 시그널 재계산
        const result = await fetchSignals(merged, activeStrategyRef.current)
        markersRef.current?.setMarkers(result.markers)
        applyTradeStats(result)
      })
      .finally(() => {
        isFetchingRef.current = false
        setIsLoading(false)
      })
  }, [])

  // 보이는 영역 기준 통계 업데이트
  const applyStatsFromFiltered = useCallback((markers: SignalResult["markers"], trades: TradeResult[]) => {
    setSignalCount({
      buy: markers.filter((m) => m.shape === "arrowUp").length,
      sell: markers.filter((m) => m.shape === "arrowDown").length,
    })
    setTradeList(trades)
    const wins = trades.filter((t) => t.pnl >= 0).length
    const losses = trades.filter((t) => t.pnl < 0).length
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
    setTradeStats({
      trades: trades.length,
      winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
      totalPnl,
      avgPnl: trades.length > 0 ? totalPnl / trades.length : 0,
      wins,
      losses,
    })
  }, [])

  const updateVisibleStats = useCallback(() => {
    if (!chartRef.current) return
    const timeRange = chartRef.current.timeScale().getVisibleRange()
    const result = signalResultRef.current
    if (!timeRange) {
      applyStatsFromFiltered(result.markers, result.trades)
      return
    }
    const from = timeRange.from as number
    const to = timeRange.to as number
    const visibleMarkers = result.markers.filter((m) => (m.time as number) >= from && (m.time as number) <= to)
    const visibleTrades = result.trades.filter((t) => (t.sellTime as number) >= from && (t.sellTime as number) <= to)
    applyStatsFromFiltered(visibleMarkers, visibleTrades)
  }, [applyStatsFromFiltered])

  const applyTradeStats = useCallback((result: SignalResult) => {
    signalResultRef.current = result
    updateVisibleStats()
  }, [updateVisibleStats])

  // 차트 생성
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chartBgColor = "#090c14"

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartBgColor },
        textColor: "#6b7280",
        fontSize: 11,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(6,182,212,0.3)", labelBackgroundColor: "#06b6d4" },
        horzLine: { color: "rgba(6,182,212,0.3)", labelBackgroundColor: "#06b6d4" },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.05)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.05)",
      },
      handleScroll: true,
      handleScale: true,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    })

    chartRef.current = chart
    seriesRef.current = candleSeries
    markersRef.current = createSeriesMarkers(candleSeries)

    fetchCandles("BTCUSDT", "1h", fixedStrategyId || "sigma-box")

    // 차트 영역 변경 시: 과거 데이터 로딩 + 보이는 영역 통계 업데이트
    const onVisibleRangeChange = () => {
      const logicalRange = chart.timeScale().getVisibleLogicalRange()
      if (logicalRange && logicalRange.from < 10) {
        fetchOlderCandles()
      }
      updateVisibleStats()
    }
    chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange)

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleRangeChange)
      chart.remove()
    }
  }, [fetchCandles, fetchOlderCandles, updateVisibleStats])

  // 전략 변경 시 마커 업데이트
  const updateStrategy = useCallback(async (strategyId: string) => {
    setActiveStrategy(strategyId)
    activeStrategyRef.current = strategyId
    if (!seriesRef.current || candlesRef.current.length === 0) return

    const result = await fetchSignals(candlesRef.current, strategyId)
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
      <div className="rounded-2xl overflow-hidden border border-white/20 shadow-lg bg-[#090c14]">
        <div className="bg-[#090c14] rounded-2xl overflow-hidden">
          {/* 종목 & 인터벌 선택 */}
          <div className="p-3 border-b border-white/[0.06] bg-[#0b0e17]">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 종목 드롭다운 */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:border-cyan-500/30 transition-all text-sm font-semibold text-white"
                >
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
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
                            ? "text-cyan-400 bg-cyan-500/10"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{s.label}</span>
                        {activeSymbol === s.symbol && <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />}
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
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
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
                  <div className="h-3 w-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                  로딩중...
                </div>
              )}
            </div>
          </div>

          {/* 전략 선택 탭 (임베디드 모드에선 전략명만 표시) */}
          {isEmbedded ? (
            <div className="px-4 py-2 border-b border-white/[0.06] bg-[#0b0e17]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-[11px] text-gray-600">
                  {strategies.find((s) => s.id === activeStrategy)?.description}
                  <span className="ml-2 text-gray-700">· BINANCE:{activeSymbol} · {activeInterval.toUpperCase()}</span>
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    Buy: {signalCount.buy}
                  </span>
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Sell: {signalCount.sell}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 border-b border-white/[0.06] bg-[#0b0e17]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mr-2">전략</span>
                  {strategies.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => updateStrategy(s.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                        activeStrategy === s.id
                          ? `${s.activeColor} ${s.color}`
                          : "border border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    Buy: {signalCount.buy}
                  </span>
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Sell: {signalCount.sell}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 차트 영역 */}
          <div ref={chartContainerRef} style={{ height: "400px", width: "100%" }} />

          {/* 하단 푸터 */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0b0e17] flex items-center justify-end">
            <span className="text-[10px] text-gray-700">Powered by Lightweight Charts™</span>
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
