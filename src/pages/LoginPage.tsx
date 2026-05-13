import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { signIn, confirmSignIn, signInWithRedirect } from "aws-amplify/auth"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from || "/"
  const { refreshUser } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [totpStep, setTotpStep] = useState(false)
  const [totpCode, setTotpCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const result = await signIn({ username: email, password })
      if (result.nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
        setTotpStep(true)
        return
      }
      const admin = await refreshUser()
      navigate(admin ? "/admin" : from)
    } catch (err: any) {
      const msg: Record<string, string> = {
        UserNotFoundException: "등록되지 않은 이메일입니다.",
        NotAuthorizedException: "이메일 또는 비밀번호가 올바르지 않습니다.",
        UserNotConfirmedException: "이메일 인증이 완료되지 않았습니다. 회원가입을 다시 진행해 주세요.",
      }
      setError(msg[err.name] || err.message || "로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await confirmSignIn({ challengeResponse: totpCode })
      const admin = await refreshUser()
      navigate(admin ? "/admin" : from)
    } catch (err: any) {
      setError(err.message || "인증 코드가 올바르지 않습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#08061a] flex items-center justify-center px-4">
      {/* 배경 글로우 */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-900/20 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* 로고 */}
        <div className="flex justify-center mb-8 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-7" />
        </div>

        <div className="bg-[#0d1117] border border-gray-700/40 rounded-2xl p-8 shadow-2xl shadow-black/40">
          {totpStep ? (
            <>
              <h1 className="text-xl font-bold text-white mb-1">2단계 인증</h1>
              <p className="text-sm text-gray-500 mb-6">인증 앱의 6자리 코드를 입력하세요</p>
              <form onSubmit={handleTotpSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">인증 코드</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-[#161b22] border border-gray-700/50 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all tracking-widest text-center text-lg"
                  />
                </div>
                {error && (
                  <p className="text-xs text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-1"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>확인 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-1">로그인</h1>
              <p className="text-sm text-gray-500 mb-6">시그마켓 계정으로 로그인하세요</p>

              {/* Google 로그인 */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithRedirect({ provider: "Google" })
                  } catch (err: any) {
                    console.error("[Google Login Error]", err)
                    setError(err.message || "Google 로그인 중 오류가 발생했습니다.")
                  }
                }}
                className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl bg-white text-gray-800 text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200 mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Google로 계속하기
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-700/50" />
                <span className="text-xs text-gray-600">또는 이메일로 로그인</span>
                <div className="flex-1 h-px bg-gray-700/50" />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="비밀번호 입력"
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
                </div>

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
                      로그인
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-gray-600 mt-6">
                계정이 없으신가요?{" "}
                <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  회원가입
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
