import { useEffect, useRef, useState } from "react"
import { TrendingUp, Users, Zap, BarChart3, ArrowUpRight } from "lucide-react"

/* ─── 카운트업 훅 ─── */
function useCountUp(target: number, suffix = "", duration = 2000) {
  const [display, setDisplay] = useState("0")
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const val = Math.round(eased * target)
            setDisplay(val.toLocaleString())
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
          observer.unobserve(el)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { ref, display: display + suffix }
}

/* ─── 스탯 데이터 ─── */
const STATS = [
  { icon: Users,       label: "활성 구독자",    value: 1200,  suffix: "+",  color: "cyan"   },
  { icon: Zap,         label: "일 평균 시그널",  value: 48,    suffix: "건", color: "purple" },
  { icon: TrendingUp,  label: "평균 수익률",    value: 18,    suffix: "%",  color: "pink"   },
  { icon: BarChart3,   label: "커스텀 인디케이터", value: 10,    suffix: "종", color: "cyan"   },
]

const COLOR_MAP: Record<string, { iconBg: string; text: string; border: string }> = {
  cyan:   { iconBg: "bg-cyan-500/10",   text: "text-cyan-400",   border: "border-cyan-500/15" },
  purple: { iconBg: "bg-purple-500/10",  text: "text-purple-400", border: "border-purple-500/15" },
  pink:   { iconBg: "bg-pink-500/10",    text: "text-pink-400",   border: "border-pink-500/15" },
}

export default function Stats() {
  return (
    <section className="relative min-h-screen md:h-full flex flex-col justify-center overflow-x-hidden py-20">
      {/* bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a081e]/50 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-5xl mx-auto">

          {/* 헤더 */}
          <div className="text-center mb-14">
            <p className="text-sm text-cyan-400 font-medium mb-3 uppercase tracking-wider">By The Numbers</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">
              트레이더들이 <span className="text-gradient">선택한 이유</span>
            </h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto">
              조건 기반 매매 시스템으로 변동성 시장에서 구조적 우위를 만듭니다.
            </p>
          </div>

          {/* 스탯 그리드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          {/* 하단 CTA */}
          <div className="mt-12 text-center">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300 group"
            >
              플랜 확인하기
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({ icon: Icon, label, value, suffix, color }: typeof STATS[number]) {
  const c = COLOR_MAP[color]
  const { ref, display } = useCountUp(value, suffix)

  return (
    <div
      ref={ref}
      className={`relative group p-6 rounded-2xl bg-white/[0.02] border ${c.border} backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1] hover:-translate-y-1`}
    >
      <div className={`inline-flex p-2.5 rounded-xl ${c.iconBg} mb-4`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div className={`text-3xl lg:text-4xl font-bold ${c.text} mb-1 tabular-nums`}>
        {display}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
