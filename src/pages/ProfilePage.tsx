import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { fetchAuthSession } from "aws-amplify/auth"
import { Header, Footer } from "../components/sections"
import { Zap, Star, Crown, Check, LogOut, User, Mail, Shield, AlertTriangle } from "lucide-react"
import type { Plan } from "../contexts/AuthContext"

const BILLING_API_URL = (import.meta.env.VITE_BILLING_API_URL as string) || ""

const PLAN_INFO: Record<Plan, {
  name: string
  subtitle: string
  color: string
  textColor: string
  borderColor: string
  bgColor: string
  icon: React.ElementType
  features: string[]
}> = {
  free: {
    name: "Free Trial",
    subtitle: "3일 무료 체험",
    color: "cyan",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/10",
    icon: Zap,
    features: ["모든 인디케이터 3일 체험", "실시간 시그널 알림 (텔레그램)", "기초 전략 가이드", "커뮤니티 접근"],
  },
  standard: {
    name: "Standard",
    subtitle: "개인 트레이더",
    color: "purple",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    icon: Star,
    features: ["모든 인디케이터 무제한 사용", "실시간 시그널 알림 (텔레그램)", "수익률 랭킹 전체 열람", "전략 가이드 전체 열람", "커뮤니티 접근", "이메일 지원"],
  },
  professional: {
    name: "Professional",
    subtitle: "프로 트레이더",
    color: "pink",
    textColor: "text-pink-400",
    borderColor: "border-pink-500/30",
    bgColor: "bg-pink-500/10",
    icon: Crown,
    features: ["모든 인디케이터 무제한 사용", "실시간 시그널 알림 (텔레그램)", "수익률 랭킹 전체 열람", "전략 가이드 전체 열람", "커뮤니티 접근", "우선 고객 지원 (24h 이내)", "전략 개별 상담 (월 1회)"],
  },
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, plan, isAdmin, signOut, isLoading, refreshUser } = useAuth()
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    setCancelError(null)
    try {
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()
      if (!idToken) throw new Error("로그인 세션이 만료되었습니다")

      const res = await fetch(`${BILLING_API_URL}/billing/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId: user!.userId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "구독 취소에 실패했습니다")

      await refreshUser()
      setCancelConfirm(false)
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : "오류가 발생했습니다")
    } finally {
      setIsCancelling(false)
    }
  }

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

  const info = PLAN_INFO[plan]
  const PlanIcon = info.icon
  const email = user.signInDetails?.loginId || user.username

  return (
    <div className="min-h-[100dvh] bg-[#08061a] text-white">
      <Header />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-900/15 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-8">내 프로필</h1>

        {/* 계정 정보 */}
        <div className="bg-[#0d1117] border border-gray-700/40 rounded-2xl p-6 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">계정 정보</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">이메일</p>
                <p className="text-sm text-white font-medium">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">User ID</p>
                <p className="text-sm text-gray-400 font-mono">{user.userId}</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">권한</p>
                  <p className="text-sm text-orange-400 font-medium">관리자</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 현재 구독 플랜 */}
        <div className={`bg-[#0d1117] border ${info.borderColor} rounded-2xl p-6 mb-5`}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">현재 구독 플랜</h2>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl ${info.bgColor} border ${info.borderColor} flex items-center justify-center flex-shrink-0`}>
              <PlanIcon className={`w-5 h-5 ${info.textColor}`} />
            </div>
            <div>
              <p className={`text-lg font-bold ${info.textColor}`}>{info.name}</p>
              <p className="text-xs text-gray-500">{info.subtitle}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${info.bgColor} ${info.textColor} border ${info.borderColor}`}>
              활성
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {info.features.map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <Check className={`w-3.5 h-3.5 ${info.textColor} flex-shrink-0`} />
                <span className="text-sm text-gray-300">{f}</span>
              </div>
            ))}
          </div>
          {plan !== "professional" && (
            <button
              onClick={() => navigate("/#pricing")}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
            >
              플랜 업그레이드
            </button>
          )}
          {plan !== "free" && (
            <button
              onClick={() => { setCancelConfirm(true); setCancelError(null) }}
              className="mt-3 w-full py-2 rounded-xl text-gray-500 text-xs hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all"
            >
              구독 취소
            </button>
          )}
        </div>

        {/* 구독 취소 확인 */}
        {cancelConfirm && (
          <div className="bg-[#0d1117] border border-red-500/30 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-400">구독을 취소하시겠습니까?</p>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              취소하면 즉시 Free 플랜으로 전환됩니다. 남은 기간에 대한 환불은 제공되지 않습니다.
            </p>
            {cancelError && (
              <p className="text-xs text-red-400 mb-3">{cancelError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setCancelConfirm(false); setCancelError(null) }}
                disabled={isCancelling}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-sm text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {isCancelling ? "처리 중..." : "구독 취소 확인"}
              </button>
            </div>
          </div>
        )}

        {/* 로그아웃 */}
        <button
          onClick={async () => { await signOut(); navigate("/") }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700/40 text-gray-400 hover:text-white hover:border-gray-600 hover:bg-white/[0.03] transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      <Footer />
    </div>
  )
}
