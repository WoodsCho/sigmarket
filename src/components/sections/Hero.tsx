export default function Hero() {
  return (
    <section className="relative overflow-hidden flex items-center justify-center">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.15)_0%,_transparent_70%)]" />
        </div>
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.12)_0%,_transparent_70%)]" />
        </div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.1)_0%,_transparent_70%)]" />
        </div>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Hero Content */}
      <div className="relative container mx-auto px-6 pt-28 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="opacity-0 animate-fade-up">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                  조건 기반 실시간 시그널
                </span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-[1.1] opacity-0 animate-fade-up-delay-1">
                감정의 개입없이,
                <br />
                <span className="text-gradient">조건으로 매매</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-400 leading-relaxed max-w-lg opacity-0 animate-fade-up-delay-2">
                해석이 아닌 조건, 예측이 아닌 반응.
                <br />
                시그마켓이 당신의 매매에 구조를 입힙니다.
              </p>
              <div className="flex flex-wrap gap-4 opacity-0 animate-fade-up-delay-3">
                <a
                  href="#signals"
                  className="group relative px-8 py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-black font-bold text-base hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10">실시간 시그널 보기</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="ml-2 relative z-10">&rarr;</span>
                </a>
                <a
                  href="#system"
                  className="px-8 py-3.5 rounded-lg border border-white/10 text-white font-medium text-base hover:bg-white/5 hover:border-white/20 transition-all duration-300"
                >
                  시스템 소개
                </a>
              </div>
            </div>

            {/* Right - Floating Cards */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.08)_0%,_transparent_70%)]" />
              {/* Main Signal Engine Card */}
              <div className="relative animate-float">
                <SignalEngineCard />
              </div>
              {/* Small floating stat cards */}
              <div className="absolute -top-4 -right-4 animate-float" style={{ animationDelay: '1s' }}>
                <div className="glass-card rounded-xl px-4 py-3 glow-cyan">
                  <div className="text-xs text-gray-400">Win Rate</div>
                  <div className="text-lg font-bold text-cyan-400">87.3%</div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 animate-float" style={{ animationDelay: '2s' }}>
                <div className="glass-card rounded-xl px-4 py-3 glow-blue">
                  <div className="text-xs text-gray-400">Active Signals</div>
                  <div className="text-lg font-bold text-cyan-400">24</div>
                </div>
              </div>
            </div>
          </div>

          {/* Partner / Powered by section */}
          <div className="mt-16 pt-8 border-t border-white/5">
            <p className="text-center text-xs text-gray-600 uppercase tracking-[0.2em] mb-6">Powered by</p>
            <div className="flex items-center justify-center gap-12 flex-wrap opacity-40">
              {["TradingView", "Telegram", "AWS Amplify", "Pine Script"].map((name) => (
                <span key={name} className="text-sm font-medium text-gray-500 tracking-wider">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SignalEngineCard() {
  return (
    <div className="glass-card rounded-2xl p-6 glow-cyan relative overflow-hidden">
      {/* Gradient border top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* Scan animation effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent h-20 animate-[scan_3s_ease-in-out_infinite]" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Real-time Signal Engine</h3>
            <p className="text-xs text-gray-500">Live monitoring active</p>
          </div>
        </div>
        <div className="space-y-4 text-sm font-mono">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-500">Market Scan</span>
            <span className="text-white font-semibold">BTC · ETH · ALT</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-500">Strategy</span>
            <span className="text-white font-semibold">Trend Following</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-500">Status</span>
            <span className="text-cyan-400 font-semibold flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              Monitoring
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">Update</span>
            <span className="text-white font-semibold">Every Tick</span>
          </div>
        </div>
      </div>
    </div>
  )
}
