import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { fetchAuthSession } from "aws-amplify/auth"
import { Header, Footer } from "../components/sections"
import { Star, Crown, Building2, ShieldCheck, RefreshCw, ArrowLeft, Copy, CheckCheck } from "lucide-react"

const BILLING_API_URL = (import.meta.env.VITE_BILLING_API_URL as string) || ""

const BANK_ACCOUNT = {
  bank: "하나은행",
  number: "87391025926407",
  rawNumber: "87391025926407",
  holder: "최선희",
}

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

export default function PaymentPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, isLoading, refreshUser } = useAuth()
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT.rawNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
    setIsPaying(true)
    setError(null)
    try {
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()
      if (!idToken) throw new Error("로그인 세션이 만료되었습니다")

      const res = await fetch(`${BILLING_API_URL}/billing/bank-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.userId,
          plan: planKey,
          billing: billingCycle,
          amount: totalAmount,
          payerEmail: email,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "신청 실패")

      await refreshUser()
      navigate("/payment/success?method=bank_transfer")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "처리 중 오류가 발생했습니다"
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

        {/* 입금 계좌 정보 */}
        <div className="bg-[#0d1117] border border-cyan-500/25 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">무통장 입금 계좌</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">은행</span>
              <span className="text-sm font-medium text-white">{BANK_ACCOUNT.bank}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">계좌번호</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-cyan-400 tracking-wider">{BANK_ACCOUNT.number}</span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                  title="복사"
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">예금주</span>
              <span className="text-sm font-medium text-white">{BANK_ACCOUNT.holder}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
            <p className="text-xs text-yellow-400/80 leading-relaxed break-keep">
              위 계좌로 입금 후 아래 버튼을 눌러주세요. 확인 후 구독이 활성화됩니다.
            </p>
          </div>
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
              : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5"
          }`}
        >
          {isPaying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5" />
              입금 완료 후 확인 요청
            </>
          )}
        </button>

        {/* 신뢰 배지 */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            안전한 직접 입금
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <RefreshCw className="w-3.5 h-3.5" />
            언제든지 취소 가능
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4 leading-relaxed">
          구독을 시작하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다.
          <br />
          입금 확인 후 영업일 기준 1일 이내 구독이 활성화됩니다.
        </p>
      </div>

      <Footer />
    </div>
  )
}
