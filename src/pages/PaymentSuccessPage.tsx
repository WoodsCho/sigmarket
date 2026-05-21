import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle, Clock } from "lucide-react"

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isBankTransfer = params.get("method") === "bank_transfer"

  useEffect(() => {
    if (isBankTransfer) return  // 무통장입금은 자동 이동 없음
    const timer = setTimeout(() => navigate("/profile"), 3000)
    return () => clearTimeout(timer)
  }, [navigate, isBankTransfer])

  return (
    <div className="min-h-[100dvh] bg-[#08061a] flex flex-col items-center justify-center gap-5 text-white px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-cyan-900/20 blur-[70px] rounded-full pointer-events-none" />

      <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
        isBankTransfer
          ? "bg-yellow-500/10 border-2 border-yellow-500/40"
          : "bg-cyan-500/10 border-2 border-cyan-500/40"
      }`}>
        {isBankTransfer
          ? <Clock className="w-10 h-10 text-yellow-400" />
          : <CheckCircle className="w-10 h-10 text-cyan-400" />}
      </div>

      <div className="relative text-center">
        {isBankTransfer ? (
          <>
            <h1 className="text-2xl font-bold mb-2">입금 확인 요청 완료!</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              입금 확인 후 <span className="text-white font-semibold">1영업일 이내</span>에 구독이 활성화됩니다.
              <br />
              활성화되면 이메일로 안내 드립니다.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">구독이 시작되었습니다!</h1>
            <p className="text-gray-400 text-sm">
              결제가 완료되었습니다. 잠시 후 프로필 페이지로 이동합니다.
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => navigate(isBankTransfer ? "/" : "/profile")}
        className="relative px-8 py-3 rounded-xl bg-cyan-500 text-white font-semibold text-sm hover:bg-cyan-400 transition-colors"
      >
        {isBankTransfer ? "메인으로" : "지금 바로 이동"}
      </button>
    </div>
  )
}
