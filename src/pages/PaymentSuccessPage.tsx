import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { fetchAuthSession } from "aws-amplify/auth"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

const BILLING_API_URL = (import.meta.env.VITE_BILLING_API_URL as string) || ""

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, isLoading, refreshUser } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const confirmed = useRef(false)

  const authKey = params.get("authKey") || ""
  const customerKey = params.get("customerKey") || ""
  const plan = params.get("plan") || ""
  const billing = params.get("billing") || "monthly"

  useEffect(() => {
    if (isLoading) return
    if (!user) { navigate("/login"); return }
    if (!authKey || !customerKey || !plan) { navigate("/"); return }
    if (confirmed.current) return
    confirmed.current = true
    authorize()
  }, [isLoading, user])

  const authorize = async () => {
    try {
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()
      if (!idToken) throw new Error("로그인 세션이 만료되었습니다")

      const res = await fetch(`${BILLING_API_URL}/billing/authorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          authKey,
          customerKey,
          userId: user!.userId,
          plan,
          billing,
        }),
      })

      const data = await res.json()
      console.error("billing/authorize response:", res.status, data)
      if (!res.ok) throw new Error(data.error || data.message || `서버 오류 (${res.status})`)

      await refreshUser()
      setStatus("success")
      setTimeout(() => navigate("/profile"), 3000)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "결제 처리 중 오류가 발생했습니다"
      console.error("authorize error:", e)
      setErrorMsg(message)
      setStatus("error")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#08061a] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm">결제를 처리하고 있습니다...</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#08061a] flex flex-col items-center justify-center gap-5 text-white px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold">결제 처리 실패</h1>
        <p className="text-gray-400 text-center max-w-sm text-sm">{errorMsg}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08061a] flex flex-col items-center justify-center gap-5 text-white px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-cyan-900/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative w-20 h-20 rounded-full bg-cyan-500/10 border-2 border-cyan-500/40 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-cyan-400" />
      </div>

      <div className="relative text-center">
        <h1 className="text-2xl font-bold mb-2">구독이 시작되었습니다!</h1>
        <p className="text-gray-400 text-sm">
          결제가 완료되었습니다. 잠시 후 프로필 페이지로 이동합니다.
        </p>
      </div>

      <button
        onClick={() => navigate("/profile")}
        className="relative px-8 py-3 rounded-xl bg-cyan-500 text-white font-semibold text-sm hover:bg-cyan-400 transition-colors"
      >
        지금 바로 이동
      </button>
    </div>
  )
}
