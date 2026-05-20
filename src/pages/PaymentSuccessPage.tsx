import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle } from "lucide-react"

export default function PaymentSuccessPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate("/profile"), 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-[100dvh] bg-[#08061a] flex flex-col items-center justify-center gap-5 text-white px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-cyan-900/20 blur-[70px] rounded-full pointer-events-none" />

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
