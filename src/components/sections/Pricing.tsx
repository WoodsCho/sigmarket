import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Zap, Star, Crown } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import FreeTrialModal from "../FreeTrialModal"

/* ─── 플랜 데이터 ─── */
const PLANS = [
  {
    key: "free",
    icon: Zap,
    name: "Free Trial",
    subtitle: "3일 무료 체험",
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/20",
    badge: null,
    ctaText: "무료로 시작하기",
    ctaClass:
      "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50",
    features: [
      "모든 인디케이터 3일 체험",
      "실시간 시그널 알림 (텔레그램)",
      "기초 전략 가이드",
      "커뮤니티 접근",
    ],
    disabled: ["수익률 랭킹 전체 열람", "우선 고객 지원", "전략 개별 상담"],
  },
  {
    key: "standard",
    icon: Star,
    name: "Standard",
    subtitle: "개인 트레이더",
    monthlyPrice: 49000,
    yearlyPrice: 39000,
    color: "purple",
    gradient: "from-purple-500/20 to-cyan-500/10",
    border: "border-purple-500/30",
    badge: "인기",
    ctaText: "Standard 시작하기",
    ctaClass:
      "bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40",
    features: [
      "모든 인디케이터 무제한 사용",
      "실시간 시그널 알림 (텔레그램)",
      "수익률 랭킹 전체 열람",
      "전략 가이드 전체 열람",
      "커뮤니티 접근",
      "이메일 지원",
    ],
    disabled: ["우선 고객 지원", "전략 개별 상담"],
  },
  {
    key: "pro",
    icon: Crown,
    name: "Professional",
    subtitle: "프로 트레이더",
    monthlyPrice: 99000,
    yearlyPrice: 79000,
    color: "pink",
    gradient: "from-pink-500/20 to-purple-500/10",
    border: "border-pink-500/30",
    badge: "Best",
    ctaText: "Professional 시작하기",
    ctaClass:
      "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40",
    features: [
      "모든 인디케이터 무제한 사용",
      "실시간 시그널 알림 (텔레그램)",
      "수익률 랭킹 전체 열람",
      "전략 가이드 전체 열람",
      "커뮤니티 접근",
      "우선 고객 지원 (24h 이내)",
      "전략 개별 상담 (월 1회)",
    ],
    disabled: [],
  },
]

const COLOR_MAP: Record<string, { text: string; dot: string; iconBg: string }> = {
  cyan:   { text: "text-cyan-400",   dot: "bg-cyan-400",   iconBg: "bg-cyan-500/10 text-cyan-400" },
  purple: { text: "text-purple-400", dot: "bg-purple-400", iconBg: "bg-purple-500/10 text-purple-400" },
  pink:   { text: "text-pink-400",   dot: "bg-pink-400",   iconBg: "bg-pink-500/10 text-pink-400" },
}

function formatPrice(price: number) {
  if (price === 0) return "무료"
  return price.toLocaleString("ko-KR") + "원"
}

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [trialOpen, setTrialOpen] = useState(false)
  const navigate = useNavigate()
  const { user: _user } = useAuth()

  function handleCta(planKey: string) {
    if (planKey === "free") {
      setTrialOpen(true)
      return
    }
    // "pro" key → use "professional" as plan param
    const planParam = planKey === "pro" ? "professional" : planKey
    navigate(`/payment?plan=${planParam}&billing=${billing}`)
  }

  return (
    <>
    <section id="pricing" className="relative h-full overflow-y-auto py-20">
      {/* bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a081e] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          {/* ── 헤더 ── */}
          <div className="text-center mb-14">
            <p className="text-sm text-purple-400 font-medium mb-3 uppercase tracking-wider">Subscription</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              구독 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">플랜</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
              나에게 맞는 플랜을 선택하고, 전략의 구조를 완성하세요.
            </p>

            {/* 월/연 토글 */}
            <div className="inline-flex items-center mt-8 bg-[#0d1117] border border-gray-700/50 rounded-full p-1 gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  billing === "monthly"
                    ? "bg-gray-700/60 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                월간 결제
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  billing === "yearly"
                    ? "bg-gray-700/60 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                연간 결제
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  20% 할인
                </span>
              </button>
            </div>
          </div>

          {/* ── 플랜 카드 ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              const c = COLOR_MAP[plan.color]
              const price =
                billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
              const isPopular = plan.key === "standard"
              const isPro = plan.key === "pro"

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl border ${plan.border} bg-gradient-to-b ${plan.gradient} bg-[#0d1117] p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    isPopular ? "ring-1 ring-purple-500/40" : ""
                  } ${isPro ? "ring-1 ring-pink-500/30" : ""}`}
                >
                  {/* 뱃지 */}
                  {plan.badge && (
                    <span
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold rounded-full border ${
                        isPro
                          ? "bg-pink-500/20 border-pink-500/40 text-pink-400"
                          : "bg-purple-500/20 border-purple-500/40 text-purple-400"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}

                  {/* 아이콘 + 이름 */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-base">{plan.name}</div>
                      <div className="text-xs text-gray-500">{plan.subtitle}</div>
                    </div>
                  </div>

                  {/* 가격 */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-bold ${c.text}`}>
                        {formatPrice(price)}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-500 text-sm mb-1">/월</span>
                      )}
                    </div>
                    {billing === "yearly" && price > 0 && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        연간 {(price * 12).toLocaleString("ko-KR")}원 청구
                      </p>
                    )}
                    {price === 0 && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        결제 정보 없이 시작
                      </p>
                    )}
                  </div>

                  {/* 기능 목록 */}
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${c.iconBg}`}>
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        {feat}
                      </li>
                    ))}
                    {plan.disabled.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-600 line-through">
                        <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center bg-gray-800 text-gray-600">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleCta(plan.key)}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${plan.ctaClass}`}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              )
            })}
          </div>

          {/* ── 하단 안내 ── */}
          <p className="text-center text-xs text-gray-600 mt-10 leading-relaxed">
            구독은 언제든지 취소할 수 있습니다. 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
          </p>
        </div>
      </div>
    </section>

    <FreeTrialModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </>
  )
}
