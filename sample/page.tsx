import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Activity } from "lucide-react"
import Link from "next/link"

export default function Page() {
  const liveSignals = [
    { symbol: "BTC", date: "2025/12/22", time: "18:00", price: "89,392", position: "LONG", isNew: true, icon: "₿" },
    { symbol: "ETH", date: "2025/12/22", time: "18:15", price: "3,034", position: "LONG", isNew: true, icon: "Ξ" },
    { symbol: "XRP", date: "2025/12/22", time: "18:00", price: "1.9164", position: "LONG", isNew: false, icon: "✕" },
    { symbol: "SOL", date: "2025/12/22", time: "18:00", price: "126", position: "LONG", isNew: false, icon: "◎" },
  ]

  const systemFeatures = [
    {
      name: "슈퍼타겟",
      description: "추세 방향 고정\n횡보 구간 시그널 차단",
      icon: TrendingUp,
    },
    {
      name: "Double Box",
      description: "변동성 구조화\n브레이크아웃 존 탐지",
      icon: Activity,
    },
    {
      name: "Order Block",
      description: "구조 기반 오더블록\n기관 매집 구간 인식",
      icon: TrendingUp,
    },
  ]

  const indicators = [
    {
      name: "BOX",
      description: "다중 기간 박스 구조\n추세 유지 / 붕괴 구간 시각화",
    },
    {
      name: "슈퍼타겟",
      description: "추세 방향 고정\n횡보 구간 시그널 차단",
    },
    {
      name: "RSI Band",
      description: "RSI를 밴드화하여\n추세 속 눌림 구간 포착",
    },
    {
      name: "MACD (0선 기준)",
      description: "0선 위/아래 구조로\n추세 강도 판단",
    },
    {
      name: "볼린저 밴드 x3",
      description: "단기·중기·장기 변동성\n동시 분석",
    },
    {
      name: "OB (Order Block)",
      description: "구조 기반 오더블록\n기관 매집 구간 인식",
    },
    {
      name: "RSI + BB 시그널",
      description: "가격 움직임 이전\n신호 발생 (선행지표)",
    },
    {
      name: "멀티 이동평균선",
      description: "배열 구조로\n추세 강도 판단 (SMA/EMA)",
    },
    {
      name: "FVG",
      description: "비효율 가격 구간\n자동 탐지",
    },
    {
      name: "BB Broken",
      description: "구조적 볼린저 돌파\n감지",
    },
    {
      name: "Volume Spike",
      description: "비정상 거래량\n발생 구간",
    },
    {
      name: "Volume Divergence",
      description: "가격과 거래량\n괴리 탐지",
    },
  ]

  const principles = [
    "안정적인 수익을 추구합니다.",
    "시간이 돈입니다 지루한 횡보구간은 기피합니다.",
    "올라가는 종목이 더 올라간다! 추세추종을 원칙으로 합니다.",
    "떨어지는 칼날을 잡으면 다쳐요! 역추세는 위험합니다.",
    "경제 논리로 매매를 하면 경제분야 전문가들은 전부 재벌이어야 합니다. 오직 가격의 움직임만 신뢰합니다.",
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-900">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center">
              <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-14" />
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm">
              <Link href="#signals" className="text-gray-400 hover:text-white transition-colors">
                실시간 시그널
              </Link>
              <Link href="#system" className="text-gray-400 hover:text-white transition-colors">
                시스템 소개
              </Link>
              <Link href="#indicators" className="text-gray-400 hover:text-white transition-colors">
                커스텀 지표
              </Link>
              <Link href="#philosophy" className="text-gray-400 hover:text-white transition-colors">
                Identity
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[35vh] min-h-[400px] overflow-hidden">
        {/* Background Chart Image with Blur and Gradient Overlay */}
        <div className="absolute inset-0">
          <img
            src="/images/ec-8a-a4-ed-81-ac-eb-a6-b0-ec-83-b7-202025-12-22-20202428.png"
            alt="Trading Chart Background"
            className="w-full h-full object-cover blur-sm opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black" />
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-6 h-full">
          <div className="max-w-6xl mx-auto h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full items-center">
              {/* Left Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Main Headline */}
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-balance">
                   충족되면,조건이
                  <br />
                  신호는 즉시 발생합니다
                </h1>

                {/* Subtext */}
                <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
                  감정이 아닌 규칙,
                  <br />
                  해석이 아닌 조건 기반
                  <br />
                  실시간 트레이딩 시그널 시스템
                </p>
              </div>

              {/* Right Card - Real-time Signal Engine */}
              <div className="lg:col-span-2">
                <div className="bg-zinc-950/80 backdrop-blur border border-emerald-500/20 rounded-lg p-6 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
                  {/* Scan animation effect */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent h-20 animate-[scan_3s_ease-in-out_infinite]" />
                  </div>

                  <div className="relative">
                    <h3 className="text-xl font-bold mb-4 text-emerald-400">Real-time Signal Engine</h3>
                    <div className="space-y-3 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Market Scan:</span>
                        <span className="text-white font-semibold">BTC · ETH · ALT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Strategy:</span>
                        <span className="text-white font-semibold">Trend Following</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Monitoring
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Update:</span>
                        <span className="text-white font-semibold">Every Tick</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signals Section */}
      <section id="signals" className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-3xl font-bold mb-2">실시간 시그널 현황</h1>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-bold text-sm">LIVE</span>
                  <span className="text-gray-500 text-sm">조건 충족 시 실시간으로 업데이트됩니다</span>
                </div>
              </div>
              <Link
                href="#"
                className="flex items-center gap-2 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white px-4 py-2 rounded-lg transition-all group flex-shrink-0"
                title="텔레그램으로 실시간 시그널 받기"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
                <span className="text-sm font-medium">실시간 알림</span>
              </Link>
            </div>
          </div>

          {/* Live Signal Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      Price (USDT)
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      Position
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {liveSignals.map((signal, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors ${
                        signal.isNew ? "bg-emerald-500/5 animate-pulse" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{signal.icon}</span>
                          <span className="font-bold text-white">{signal.symbol}</span>
                          {signal.isNew && (
                            <Badge className="bg-yellow-400 text-black font-bold px-2 py-0.5 text-xs animate-pulse">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-400">
                          {signal.date} {signal.time}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-white font-semibold">{signal.price}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={
                            signal.position === "LONG"
                              ? "bg-emerald-500 text-black hover:bg-emerald-400 font-bold px-4 py-1 shadow-lg shadow-emerald-500/30"
                              : "bg-red-500 text-white hover:bg-red-400 font-bold px-4 py-1 shadow-lg shadow-red-500/30"
                          }
                        >
                          {signal.position}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-gray-500 text-xs">
              시그마켓은 감정이 아닌 조건으로 매매합니다. 트레이딩뷰 기반 커스텀 인디케이터로 실시간 시그널을
              제공합니다.
            </p>
          </div>
        </div>
      </section>

      {/* System Section */}
      <section id="system" className="container mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="mb-4">
              <Badge className="bg-zinc-900 text-gray-300 border border-zinc-800 px-4 py-1.5 text-xs uppercase tracking-wider font-semibold">
                No.1 Project
              </Badge>
            </div>
            <h2 className="text-xs text-gray-500 mb-8">BOX + Bollinger Band + Super Target</h2>
          </div>

          <div className="mb-12">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              <img
                src="/images/ec-8a-a4-ed-81-ac-eb-a6-b0-ec-83-b7-202025-12-22-20202428.png"
                alt="BTC/USDT 차트 - Buy/Sell 시그널"
                className="w-full h-auto"
              />
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                <p className="text-sm text-gray-400 text-center">
                  <span className="text-emerald-400 font-semibold">Buy</span>: LONG 시그널 |
                  <span className="text-red-400 font-semibold ml-2">Sell</span>: SHORT 시그널
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {systemFeatures.map((feature, idx) => (
              <Card
                key={idx}
                className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <CardHeader>
                  <feature.icon className="h-10 w-10 mb-4 text-emerald-400" />
                  <CardTitle className="text-2xl mb-3">{feature.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 leading-relaxed whitespace-pre-line">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Indicators Section */}
      <section id="indicators" className="container mx-auto px-6 py-16 lg:py-24 bg-zinc-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-balance">커스텀 보조지표</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              TradingView 기반 전문 인디케이터 시스템
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicators.map((indicator, idx) => (
              <Card key={idx} className="bg-black border-zinc-800 hover:border-emerald-500/30 transition-all group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Activity className="h-5 w-5 text-emerald-500/70 group-hover:text-emerald-400 transition-colors" />
                    <div className="h-2 w-2 rounded-full bg-zinc-700 group-hover:bg-emerald-500 transition-colors" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-emerald-400 transition-colors">
                    {indicator.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{indicator.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="container mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-14" />
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8 lg:p-12">
            <ul className="space-y-6">
              {principles.map((principle, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <span className="text-emerald-400 font-bold text-lg flex-shrink-0">{idx + 1}.</span>
                  <p className="text-xl text-gray-300 leading-relaxed">{principle}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-14" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              TradingView 기반 커스텀 인디케이터 & 실시간 시그널 시스템
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
