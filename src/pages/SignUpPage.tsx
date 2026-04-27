import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth"
import { Eye, EyeOff, ArrowRight, Loader2, Mail } from "lucide-react"

type Step = "form" | "verify"

export default function SignUpPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("form")

  /* 폼 입력 */
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState("")

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  /* ── 1단계: 회원가입 제출 ── */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.")
      return
    }

    if (!agreePrivacy || !agreeTerms) {
      setError("서비스 이용약관 및 개인정보 수집·이용에 동의해 주세요.")
      return
    }

    setIsLoading(true)
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      })
      setStep("verify")
    } catch (err: any) {
      const msg: Record<string, string> = {
        UsernameExistsException: "이미 가입된 이메일입니다.",
        InvalidPasswordException: "비밀번호는 8자 이상, 숫자·대소문자·특수문자를 포함해야 합니다.",
        InvalidParameterException: "입력값을 다시 확인해 주세요.",
      }
      setError(msg[err.name] || err.message || "회원가입 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  /* ── 2단계: 인증 코드 확인 ── */
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      navigate("/login", { state: { confirmed: true } })
    } catch (err: any) {
      const msg: Record<string, string> = {
        CodeMismatchException: "인증 코드가 올바르지 않습니다.",
        ExpiredCodeException: "인증 코드가 만료되었습니다. 재발송 후 다시 시도해 주세요.",
      }
      setError(msg[err.name] || err.message || "인증 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  /* 재발송 */
  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await resendSignUpCode({ username: email })
      setResendCooldown(60)
      const t = setInterval(() => {
        setResendCooldown(c => {
          if (c <= 1) { clearInterval(t); return 0 }
          return c - 1
        })
      }, 1000)
    } catch (err: any) {
      setError(err.message || "재발송 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="min-h-screen bg-[#08061a] flex items-center justify-center px-4">
      {/* 배경 글로우 */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-900/20 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* 로고 */}
        <div className="flex justify-center mb-8 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-7" />
        </div>

        <div className="bg-[#0d1117] border border-gray-700/40 rounded-2xl p-8 shadow-2xl shadow-black/40">

          {/* ── Step 1: 회원가입 폼 ── */}
          {step === "form" && (
            <>
              <h1 className="text-xl font-bold text-white mb-1">회원가입</h1>
              <p className="text-sm text-gray-500 mb-6">시그마켓 계정을 만드세요</p>

              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                {/* 이메일 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#161b22] border border-gray-700/50 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  />
                </div>

                {/* 비밀번호 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="8자 이상, 숫자·대소문자·특수문자 포함"
                      required
                      className="w-full px-4 py-2.5 pr-11 rounded-xl bg-[#161b22] border border-gray-700/50 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* 강도 힌트 */}
                  <p className="text-[10px] text-gray-600">대문자, 소문자, 숫자, 특수문자(!@#$ 등) 각 1개 이상 포함</p>
                </div>

                {/* 동의 항목 */}
                <div className="flex flex-col gap-2 pt-1 border-t border-gray-700/40">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-[#161b22] accent-cyan-500 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                      <span className="text-pink-400 font-medium">[필수]</span>{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-cyan-400 transition-colors" onClick={e => e.stopPropagation()}>
                        서비스 이용약관
                      </a>에 동의합니다.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={e => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-[#161b22] accent-cyan-500 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                      <span className="text-pink-400 font-medium">[필수]</span>{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-cyan-400 transition-colors" onClick={e => e.stopPropagation()}>
                        개인정보 수집·이용
                      </a>에 동의합니다. (이메일, 서비스 이용 기록)
                    </span>
                  </label>
                </div>

                {/* 에러 */}
                {error && (
                  <p className="text-xs text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-1"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      계속하기
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-gray-600 mt-6">
                이미 계정이 있으신가요?{" "}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  로그인
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: 이메일 인증 ── */}
          {step === "verify" && (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-5 mx-auto">
                <Mail className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-1 text-center">이메일 인증</h1>
              <p className="text-sm text-gray-500 mb-1 text-center">
                <span className="text-cyan-400 font-medium">{email}</span>으로
              </p>
              <p className="text-sm text-gray-500 mb-6 text-center">6자리 인증 코드를 전송했습니다.</p>

              <form onSubmit={handleConfirm} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">인증 코드</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#161b22] border border-gray-700/50 text-white text-sm placeholder-gray-600 text-center tracking-[0.4em] font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-xs text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || code.length < 6}
                  className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증 완료"}
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-xs text-gray-500 hover:text-cyan-400 transition-colors disabled:text-gray-700 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `재발송 (${resendCooldown}초)` : "코드를 받지 못하셨나요? 재발송"}
                </button>
              </div>

              <button
                onClick={() => { setStep("form"); setError(""); setCode("") }}
                className="w-full text-center text-xs text-gray-600 hover:text-gray-400 mt-3 transition-colors"
              >
                ← 이메일 변경
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
