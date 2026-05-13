import { useNavigate, useSearchParams } from "react-router-dom"
import { XCircle } from "lucide-react"

export default function PaymentFailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const code = params.get("code") || ""
  const rawMessage = params.get("message") || "결제가 취소되거나 실패했습니다."

  let message = rawMessage
  try { message = decodeURIComponent(rawMessage) } catch { /* keep raw */ }

  return (
    <div className="min-h-[100dvh] bg-[#08061a] flex flex-col items-center justify-center gap-5 text-white px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-red-400" />
      </div>

      <div className="relative text-center">
        <h1 className="text-xl font-bold mb-2">결제 실패</h1>
        <p className="text-gray-400 text-sm max-w-sm">{message}</p>
        {code && <p className="text-xs text-gray-600 mt-2">오류 코드: {code}</p>}
      </div>

      <div className="relative flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
        >
          다시 시도
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
        >
          홈으로
        </button>
      </div>
    </div>
  )
}
