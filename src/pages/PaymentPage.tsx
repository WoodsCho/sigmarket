import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { loadTossPayments } from "@tosspayments/tosspayments-sdk"
import { Header, Footer } from "../components/sections"
import { Star, Crown, CreditCard, ShieldCheck, RefreshCw, ArrowLeft, Smartphone } from "lucide-react"

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string

const PLAN_INFO = {
  standard: {
    name: "Standard",
    Icon: Star,
    colorClass: "text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30",
    monthlyPrice: 49000,
    yearlyPrice: 39000,
  },
  professional: {
    name: "Professional",
    Icon: Crown,
    colorClass: "text-pink-400",
    bgClass: "bg-pink-500/10",
    borderClass: "border-pink-500/30",
    monthlyPrice: 99000,
    yearlyPrice: 79000,
  },
} as const

type PlanKey = keyof typeof PLAN_INFO
type PayMethod = "CARD" | "TOSSPAY"

export default function PaymentPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, isLoading } = useAuth()
  const [selectedMethod, setSelectedMethod] = useState<PayMethod>("CARD")
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const planKey = params.get("plan") as PlanKey | null
  const billingCycle = (params.get("billing") || "monthly") as "monthly" | "yearly"

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#08061a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    navigate("/login")
    return null
  }

  if (!planKey || !PLAN_INFO[planKey]) {
    navigate("/")
    return null
  }

  const plan = PLAN_INFO[planKey]
  const pricePerMonth = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
  const totalAmount = billingCycle === "yearly" ? plan.yearlyPrice * 12 : plan.monthlyPrice
  const email = user.signInDetails?.loginId || user.username || ""

  const handlePay = async () => {
    if (!TOSS_CLIENT_KEY) {
      setError("결제 설정이 올바르지 않습니다. 관리자에게 문의해주세요.")
      return
    }
    setIsPaying(true)
    setError(null)
    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: user.userId })

      const baseRequest = {
        successUrl: `${window.location.origin}/payment/success?plan=${planKey}&billing=${billingCycle}`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: email,
        customerName: email.split("@")[0] || "고객",
      }

      if (selectedMethod === "TOSSPAY") {
        await payment.requestBillingAuth({
          method: "CARD",
          easyPay: "토스페이",
          flowMode: "DIRECT",
          ...baseRequest,
        })
      } else {
        await payment.requestBillingAuth({
          method: "CARD",
          ...baseRequest,
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "결제 창을 열지 못했습니다. 다시 시도해주세요."
      setError(message)
      setIsPaying(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#08061a] text-white">
      <Header />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-900/15 blur-[70px] rounded-full pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20 max-w-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          이전으로
        </button>

        <h1 className="text-2xl font-bold mb-8">구독 시작하기</h1>

        {/* 플랜 요약 */}
        <div className={`bg-[#0d1117] border ${plan.borderClass} rounded-2xl p-6 mb-4`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl ${plan.bgClass} border ${plan.borderClass} flex items-center justify-center`}>
              <plan.Icon className={`w-5 h-5 ${plan.colorClass}`} />
            </div>
            <div>
              <p className={`text-lg font-bold ${plan.colorClass}`}>{plan.name}</p>
              <p className="text-xs text-gray-500">{billingCycle === "yearly" ? "연간 구독" : "월간 구독"}</p>
            </div>
          </div>

          <div className="border-t border-gray-700/40 pt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {billingCycle === "yearly" ? "연간 청구 금액" : "월간 청구 금액"}
              </p>
              <p className={`text-3xl font-bold ${plan.colorClass}`}>
                {totalAmount.toLocaleString("ko-KR")}원
              </p>
              {billingCycle === "yearly" && (
                <p className="text-xs text-gray-500 mt-1">
                  월 {pricePerMonth.toLocaleString("ko-KR")}원 환산
                </p>
              )}
            </div>
            <span className="text-sm text-gray-500">{billingCycle === "yearly" ? "/ 년" : "/ 월"}</span>
          </div>
        </div>

        {/* 결제 계정 */}
        <div className="bg-[#0d1117] border border-gray-700/40 rounded-2xl p-4 mb-5">
          <p className="text-xs text-gray-500 mb-1">결제 계정</p>
          <p className="text-sm text-white">{email}</p>
        </div>

        {/* 결제 수단 선택 */}
        <div className="bg-[#0d1117] border border-gray-700/40 rounded-2xl p-5 mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">결제 수단</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedMethod("CARD")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 ${
                selectedMethod === "CARD"
                  ? "border-cyan-500/60 bg-cyan-500/10 text-white"
                  : "border-gray-700/50 bg-white/[0.02] text-gray-500 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              <CreditCard className={`w-6 h-6 ${selectedMethod === "CARD" ? "text-cyan-400" : ""}`} />
              <span className="text-sm font-medium">신용 · 체크카드</span>
              {selectedMethod === "CARD" && (
                <span className="text-[10px] text-cyan-400 font-semibold">선택됨</span>
              )}
            </button>

            <button
              onClick={() => setSelectedMethod("TOSSPAY")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 ${
                selectedMethod === "TOSSPAY"
                  ? "border-blue-500/60 bg-blue-500/10 text-white"
                  : "border-gray-700/50 bg-white/[0.02] text-gray-500 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              <Smartphone className={`w-6 h-6 ${selectedMethod === "TOSSPAY" ? "text-blue-400" : ""}`} />
              <span className="text-sm font-medium">토스페이</span>
              {selectedMethod === "TOSSPAY" && (
                <span className="text-[10px] text-blue-400 font-semibold">선택됨</span>
              )}
            </button>
          </div>

          {selectedMethod === "TOSSPAY" && (
            <p className="text-xs text-gray-600 mt-3 text-center">
              QR 코드 또는 토스앱으로 카드를 등록합니다
            </p>
          )}
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 mb-5">
            {error}
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handlePay}
          disabled={isPaying}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all duration-300 ${
            isPaying
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : selectedMethod === "TOSSPAY"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5"
          }`}
        >
          {isPaying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              처리 중...
            </>
          ) : selectedMethod === "TOSSPAY" ? (
            <>
              <Smartphone className="w-5 h-5" />
              토스페이로 구독 시작
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              카드 등록 및 구독 시작
            </>
          )}
        </button>

        {/* 신뢰 배지 */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            토스페이먼츠 보안 결제
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <RefreshCw className="w-3.5 h-3.5" />
            언제든지 취소 가능
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4 leading-relaxed">
          구독을 시작하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다.
          <br />
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
        </p>
      </div>

      <Footer />
    </div>
  )
}
