import { useState } from "react"
import { X, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

const API_URL = import.meta.env.VITE_FREE_TRIAL_API_URL || ""

interface Props {
  open: boolean
  onClose: () => void
}

type Status = "idle" | "loading" | "success" | "already" | "error"

export default function FreeTrialModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("")
  const [telegram, setTelegram] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !telegram.trim()) return

    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          telegram: telegram.trim().replace(/^@/, ""),
        }),
      })

      const data = await res.json()

      if (res.status === 409 || data.alreadyRegistered) {
        setStatus("already")
        return
      }
      if (!res.ok) {
        throw new Error(data.message || "서버 오류")
      }

      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "요청에 실패했습니다.")
    }
  }

  function handleClose() {
    setEmail("")
    setTelegram("")
    setStatus("idle")
    setErrorMsg("")
    onClose()
  }

  return (
    /* 오버레이 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* 배경 블러 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* 모달 */}
      <div className="relative w-full max-w-md bg-[#0d1117] border border-gray-700/60 rounded-2xl shadow-2xl shadow-black/60 p-8">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ─── 성공 화면 ─── */}
        {status === "success" ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-14 h-14 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">신청 완료!</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              3일 무료 체험 신청이 완료되었습니다.<br />
              텔레그램으로 안내 메시지를 보내드릴게요.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
            >
              확인
            </button>
          </div>
        ) : status === "already" ? (
          /* ─── 중복 신청 화면 ─── */
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-14 h-14 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">이미 신청된 계정입니다</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              해당 이메일로 이미 무료 체험을 신청하셨습니다.<br />
              문의 사항은 텔레그램으로 연락해 주세요.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors"
            >
              확인
            </button>
          </div>
        ) : (
          /* ─── 신청 폼 ─── */
          <>
            {/* 헤더 */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                3일 무료 체험
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">무료 체험 신청</h2>
              <p className="text-gray-500 text-sm">이메일과 텔레그램 아이디를 입력해 주세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* 이메일 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="w-full bg-[#161b22] border border-gray-700/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                  />
                </div>
              </div>

              {/* 텔레그램 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  텔레그램 아이디
                </label>
                <div className="relative">
                  <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@username"
                    required
                    className="w-full bg-[#161b22] border border-gray-700/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">@ 포함 또는 제외 모두 가능합니다.</p>
              </div>

              {/* 에러 메시지 */}
              {status === "error" && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errorMsg || "요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
                </p>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={status === "loading" || !email.trim() || !telegram.trim()}
                className="mt-1 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    신청 중...
                  </>
                ) : (
                  "무료 체험 신청하기"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
