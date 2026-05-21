import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Trash2, Edit3, Save, X, LogOut,
  Loader2, Eye, EyeOff, ArrowUp, ArrowDown, ImagePlus,
  Users, CheckCircle, RefreshCw, AlertCircle,
} from "lucide-react"
import { signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignIn } from "aws-amplify/auth"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import type { Indicator } from "../types"
import ImageUploader from "../components/ui/ImageUploader"
import MDEditor, { commands } from "@uiw/react-md-editor"
import "@uiw/react-md-editor/markdown-editor.css"

/* ─── 환경 변수 ─── */
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || ""
const API_URL = import.meta.env.VITE_INDICATORS_API_URL
  || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/indicators` : "")
const BILLING_API_URL = (import.meta.env.VITE_BILLING_API_URL as string) || ""

/* ─── 빈 인디케이터 템플릿 ─── */
function emptyIndicator(): Indicator {
  return {
    name: "",
    subtitle: "",
    description: "",
    image: "",
    content: "",
    sections: [],
    strategyId: "sigma-box",
    strategyCode: "",
    tags: [],
  }
}

/* ========================================== */
/*              로그인 게이트                   */
/* ========================================== */
function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [totpSetupUri, setTotpSetupUri] = useState("")
  const [step, setStep] = useState<"login" | "newPassword" | "totpSetup" | "totpVerify">("login")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleNextStep = async (nextStep: any) => {
    const signInStep = nextStep?.signInStep || "DONE"
    switch (signInStep) {
      case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
        setStep("newPassword")
        break
      case "CONTINUE_SIGN_IN_WITH_TOTP_SETUP": {
        const details = nextStep?.totpSetupDetails
        if (details) {
          const uri = details.getSetupUri("Sigmarket", email)
          setTotpSetupUri(uri.toString())
        }
        setStep("totpSetup")
        break
      }
      case "CONFIRM_SIGN_IN_WITH_TOTP_CODE":
        setStep("totpVerify")
        break
      case "DONE":
        onLogin()
        break
      default:
        onLogin()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await signIn({ username: email, password: pw })
      await handleNextStep(result.nextStep)
    } catch (err: any) {
      setError(err.message || "로그인 실패")
    } finally {
      setLoading(false)
    }
  }

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await confirmSignIn({ challengeResponse: newPw })
      await handleNextStep(result.nextStep)
    } catch (err: any) {
      setError(err.message || "비밀번호 변경 실패")
    } finally {
      setLoading(false)
    }
  }

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await confirmSignIn({ challengeResponse: totpCode })
      await handleNextStep(result.nextStep)
    } catch (err: any) {
      setError(err.message || "인증 코드가 올바르지 않습니다.")
    } finally {
      setLoading(false)
    }
  }

  const formClass = "bg-zinc-950 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm space-y-5"
  const inputClass = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
  const btnClass = "w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"

  if (step === "newPassword") {
    return (
      <div className="min-h-[100dvh] bg-[var(--theme-bg)] flex items-center justify-center">
        <form onSubmit={handleNewPassword} className={formClass}>
          <h1 className="text-2xl font-bold text-white text-center">새 비밀번호 설정</h1>
          <p className="text-gray-400 text-sm text-center">첫 로그인 시 비밀번호를 변경해야 합니다.</p>
          <div>
            <label className="block text-sm text-gray-400 mb-1">새 비밀번호</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputClass} autoFocus />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className={btnClass}>
            {loading ? "처리 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    )
  }

  if (step === "totpSetup") {
    const secretKey = totpSetupUri.split("secret=")[1]?.split("&")[0] || ""
    return (
      <div className="min-h-[100dvh] bg-[var(--theme-bg)] flex items-center justify-center">
        <form onSubmit={handleTotpVerify} className={formClass}>
          <h1 className="text-2xl font-bold text-white text-center">MFA 설정</h1>
          <p className="text-gray-400 text-sm text-center">인증 앱(Google Authenticator 등)으로 QR 코드를 스캔하세요.</p>
          {totpSetupUri && (
            <div className="flex justify-center py-2">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={totpSetupUri} size={180} />
              </div>
            </div>
          )}
          <details className="text-center">
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">QR 스캔이 안 되면 수동 입력</summary>
            <p className="text-cyan-400 text-xs font-mono break-all select-all mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-2">{secretKey}</p>
          </details>
          <div>
            <label className="block text-sm text-gray-400 mb-1">인증 코드 (6자리)</label>
            <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="000000"
              className={`${inputClass} text-center tracking-widest text-lg`} autoFocus maxLength={6} />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading || totpCode.length !== 6} className={btnClass}>
            {loading ? "확인 중..." : "MFA 등록 완료"}
          </button>
        </form>
      </div>
    )
  }

  if (step === "totpVerify") {
    return (
      <div className="min-h-[100dvh] bg-[var(--theme-bg)] flex items-center justify-center">
        <form onSubmit={handleTotpVerify} className={formClass}>
          <h1 className="text-2xl font-bold text-white text-center">2단계 인증</h1>
          <p className="text-gray-400 text-sm text-center">인증 앱의 6자리 코드를 입력하세요.</p>
          <div>
            <label className="block text-sm text-gray-400 mb-1">인증 코드</label>
            <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="000000"
              className={`${inputClass} text-center tracking-widest text-lg`} autoFocus maxLength={6} />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading || totpCode.length !== 6} className={btnClass}>
            {loading ? "확인 중..." : "인증"}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--theme-bg)] flex items-center justify-center">
      <form onSubmit={handleSubmit} className={formClass}>
        <h1 className="text-2xl font-bold text-white text-center">Admin Login</h1>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoFocus />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputClass} />
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading} className={btnClass}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  )
}

/* ========================================== */
/*           관리자 대시보드                     */
/* ========================================== */
export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth()
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  // admin 그룹 체크 — 로그인은 됐지만 admin 아닌 경우만 차단
  useEffect(() => {
    if (isLoading) return
    if (user && !isAdmin) {
      navigate("/", { replace: true })
    }
  }, [user, isAdmin, isLoading])

  useEffect(() => {
    getCurrentUser()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false))
  }, [])

  const handleLogout = async () => {
    await signOut()
    setAuthed(false)
  }

  if (checking) {
    return (
      <div className="min-h-[100dvh] bg-[var(--theme-bg)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />
  return <AdminDashboard onLogout={handleLogout} />
}

/* ─── 대시보드 본체 ─── */
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [indicators, setIndicators] = useState<(Indicator & { sortOrder?: number; isPublished?: boolean })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"indicators" | "subscriptions">("indicators")

  /* API에서 전체 목록 로드 (관리자용: isPublished 필터 없이) */
  const loadIndicators = useCallback(async () => {
    setIsLoading(true)
    try {
      if (!API_URL) throw new Error("API URL not set")
      const res = await fetch(API_URL)
      const data = await res.json()
      if (data.indicators) {
        setIndicators(
          data.indicators.map((item: any) => ({
            ...item,
            tags: typeof item.tags === "string" ? JSON.parse(item.tags) : item.tags || [],
            sections: typeof item.sections === "string" ? JSON.parse(item.sections) : item.sections || [],
          }))
        )
      }
    } catch {
      /* API 실패 시 빈 목록 */
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadIndicators() }, [loadIndicators])

  /* JWT 토큰 가져오기 */
  const getAuthToken = async () => {
    try {
      const session = await fetchAuthSession()
      return session.tokens?.idToken?.toString() || ""
    } catch {
      return ""
    }
  }

  /* 저장 (POST) */
  const handleSave = async (indicator: Indicator & { sortOrder?: number; isPublished?: boolean }) => {
    if (!API_URL) {
      setMessage("⚠️ API URL 미설정")
      return
    }
    setSaving(true)
    setMessage("")
    try {
      const token = await getAuthToken()
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          secret: ADMIN_SECRET,
          ...indicator,
          sortOrder: indicator.sortOrder ?? 999,
          isPublished: indicator.isPublished ?? true,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      setMessage("✅ 저장 완료")
      setEditIndex(null)
      await loadIndicators()
    } catch (err: any) {
      setMessage(`❌ 저장 실패: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  /* 삭제 (POST with _action: delete) */
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    if (!API_URL) return
    setSaving(true)
    try {
      const token = await getAuthToken()
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ secret: ADMIN_SECRET, _action: "delete", id }),
      })
      if (!res.ok) throw new Error("Delete failed")
      setMessage("🗑️ 삭제 완료")
      setEditIndex(null)
      await loadIndicators()
    } catch {
      setMessage("❌ 삭제 실패")
    } finally {
      setSaving(false)
    }
  }

  /* 새 게시글 추가 */
  const handleAdd = () => {
    setIndicators((prev) => [...prev, { ...emptyIndicator(), isPublished: true, sortOrder: prev.length + 1 }])
    setEditIndex(indicators.length)
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--theme-bg)] text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-[var(--theme-bg)]/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-cyan-500">Σ</span> Admin
          </h1>
          <div className="flex items-center gap-4">
            {message && <span className="text-sm">{message}</span>}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" /> 로그아웃
            </button>
          </div>
        </div>
        {/* 탭 */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          <button
            onClick={() => setActiveTab("indicators")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "indicators"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            인디케이터 관리
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "subscriptions"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            구독 관리
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "subscriptions" ? (
          <SubscriptionPanel />
        ) : (
          <>
        {/* 상단 도구 */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400 text-sm">
            총 <span className="text-white font-semibold">{indicators.length}</span>개 인디케이터
          </p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> 새 게시글
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {indicators.map((ind, idx) => (
              <div key={ind.id || idx}>
                {editIndex === idx ? (
                  <IndicatorEditor
                    indicator={ind}
                    onSave={handleSave}
                    onCancel={() => setEditIndex(null)}
                    onDelete={ind.id ? () => handleDelete(ind.id!) : undefined}
                    saving={saving}
                  />
                ) : (
                  <IndicatorRow
                    indicator={ind}
                    onEdit={() => setEditIndex(idx)}
                    onMoveUp={idx > 0 ? () => {
                      setIndicators((prev) => {
                        const arr = [...prev]
                        ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
                        return arr
                      })
                    } : undefined}
                    onMoveDown={idx < indicators.length - 1 ? () => {
                      setIndicators((prev) => {
                        const arr = [...prev]
                        ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
                        return arr
                      })
                    } : undefined}
                  />
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </main>
    </div>
  )
}

/* ─── 무통장입금 구독 관리 패널 ─── */
type PendingItem = {
  userId: string
  plan: string
  billing: string
  amount: number
  payerEmail: string
  createdAt: string
}

function SubscriptionPanel() {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getToken = async () => {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() || ""
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${BILLING_API_URL}/billing/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "로드 실패")
      setItems(data.items || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleActivate = async (userId: string) => {
    if (!confirm(`이 사용자의 구독을 활성화하시겠습니까?`)) return
    setActivating(userId)
    try {
      const token = await getToken()
      const res = await fetch(`${BILLING_API_URL}/billing/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "활성화 실패")
      await load()
    } catch (e: any) {
      alert(`오류: ${e.message}`)
    } finally {
      setActivating(null)
    }
  }

  const PLAN_LABELS: Record<string, string> = {
    standard: "Standard",
    professional: "Professional",
  }
  const BILLING_LABELS: Record<string, string> = {
    monthly: "월간",
    yearly: "연간",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">무통장입금 대기 중</h2>
          <p className="text-xs text-gray-500 mt-0.5">입금 확인 후 '활성화' 버튼을 눌러주세요</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">대기 중인 무통장입금 신청이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.userId}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{item.payerEmail}</span>
                  <span className="text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-1.5 py-0.5 rounded font-bold shrink-0">대기중</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{PLAN_LABELS[item.plan] ?? item.plan} · {BILLING_LABELS[item.billing] ?? item.billing}</span>
                  <span>{(item.amount || 0).toLocaleString("ko-KR")}원</span>
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleString("ko-KR") : "—"}</span>
                </div>
              </div>
              <button
                onClick={() => handleActivate(item.userId)}
                disabled={activating === item.userId}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-sm font-semibold transition-colors disabled:opacity-50 shrink-0"
              >
                {activating === item.userId ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 활성화 중...</>
                ) : (
                  <><CheckCircle className="h-3.5 w-3.5" /> 구독 활성화</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── 목록 행 ─── */
function IndicatorRow({
  indicator,
  onEdit,
  onMoveUp,
  onMoveDown,
}: {
  indicator: Indicator & { isPublished?: boolean }
  onEdit: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  return (
    <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 hover:border-zinc-700 transition-colors">
      {/* 순서 조정 */}
      <div className="flex flex-col gap-0.5">
        <button onClick={onMoveUp} disabled={!onMoveUp} className="text-gray-500 hover:text-white disabled:opacity-20">
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={onMoveDown} disabled={!onMoveDown} className="text-gray-500 hover:text-white disabled:opacity-20">
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 이미지 미리보기 */}
      <div className="w-16 h-10 bg-zinc-900 rounded overflow-hidden flex-shrink-0">
        {indicator.image ? (
          <img src={indicator.image} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">No img</div>
        )}
      </div>

      {/* 제목/부제 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{indicator.name || "(제목 없음)"}</span>
          {indicator.isPublished === false && (
            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">비공개</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{indicator.subtitle}</p>
      </div>

      {/* 태그 */}
      <div className="hidden md:flex gap-1.5 flex-shrink-0">
        {indicator.tags.slice(0, 3).map((t, i) => (
          <span key={i} className="text-[10px] bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-gray-400">
            {t}
          </span>
        ))}
      </div>

      {/* 수정 */}
      <button onClick={onEdit} className="text-gray-400 hover:text-cyan-400 transition-colors p-1">
        <Edit3 className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ─── 편집 폼 ─── */
function IndicatorEditor({
  indicator,
  onSave,
  onCancel,
  onDelete,
  saving,
}: {
  indicator: Indicator & { sortOrder?: number; isPublished?: boolean }
  onSave: (ind: Indicator & { sortOrder?: number; isPublished?: boolean }) => void
  onCancel: () => void
  onDelete?: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ ...indicator })
  const [tagInput, setTagInput] = useState(indicator.tags.join(", "))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mdApiRef = useRef<any>(null)
  const [imgUploading, setImgUploading] = useState(false)

  const uploadImage = async (file: File) => {
    if (!API_URL) return
    setImgUploading(true)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString() || ""
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ _action: "upload-url", fileName: file.name, fileType: file.type }),
      })
      if (!res.ok) throw new Error("presigned URL 발급 실패")
      const { uploadUrl, publicUrl } = await res.json()
      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
      if (mdApiRef.current) {
        mdApiRef.current.replaceSelection(`\n![image](${publicUrl})\n`)
      }
    } catch (err: any) {
      console.error("이미지 업로드 실패:", err)
    } finally {
      setImgUploading(false)
    }
  }

  const uploadImageCommand: commands.ICommand = {
    name: "upload-image",
    keyCommand: "upload-image",
    buttonProps: { "aria-label": "이미지 업로드", title: "이미지 업로드" },
    icon: (
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <ImagePlus style={{ width: 14, height: 14 }} />
      </span>
    ),
    execute: (_state, api) => {
      mdApiRef.current = api
      fileInputRef.current?.click()
    },
  }

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean) })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-6 space-y-6"
    >
      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="제목 (name)" value={form.name} onChange={(v) => set("name", v)} required />
        <Field label="부제목 (subtitle)" value={form.subtitle} onChange={(v) => set("subtitle", v)} />
        <Field label="태그 (쉼표 구분)" value={tagInput} onChange={setTagInput} placeholder="주식, 해외선물, 코인" />
      </div>

      {/* 소개 문구 */}
      <Field
        label="소개 (description) — 카드 미리보기용"
        value={form.description || ""}
        onChange={(v) => set("description", v)}
        placeholder="카드에 표시될 짧은 소개 문구를 입력하세요"
        multiline
      />

      {/* 대표 이미지 업로드 */}
      <ImageUploader
        label="대표 이미지"
        value={form.image || ""}
        onChange={(url) => set("image", url)}
      />

      {/* 이미지 히든 인풋 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await uploadImage(file)
          e.target.value = ""
        }}
      />

      {/* ═══ 마크다운 에디터 ═══ */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          상세 설명 (마크다운)
          {imgUploading && <span className="ml-2 text-xs text-cyan-400 animate-pulse">이미지 업로드 중...</span>}
        </label>
        <div data-color-mode="dark">
          <MDEditor
            value={form.content}
            onChange={(v) => set("content", v ?? "")}
            commands={[
              commands.bold,
              commands.italic,
              commands.strikethrough,
              commands.hr,
              commands.title,
              commands.divider,
              commands.link,
              commands.quote,
              commands.code,
              commands.codeBlock,
              commands.divider,
              commands.unorderedListCommand,
              commands.orderedListCommand,
              commands.checkedListCommand,
              commands.divider,
              uploadImageCommand,
            ]}
            height={500}
            preview="live"
          />
        </div>
      </div>

      {/* 전략 ID */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          전략 ID
          <span className="text-gray-600 ml-2 text-xs">내장 전략: sigma-box, super-target, order-block, rsi-bb</span>
        </label>
        <input
          value={form.strategyId || ""}
          onChange={(e) => set("strategyId", e.target.value)}
          placeholder="sigma-box"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* 전략 코드 (JavaScript) */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          전략 코드 (JavaScript)
          <span className="text-gray-600 ml-2 text-xs">어떤 형식이든 OK — long/short 시그널을 자동 탐지합니다</span>
        </label>
        <textarea
          value={form.strategyCode || ""}
          onChange={(e) => set("strategyCode", e.target.value)}
          rows={12}
          placeholder={`// ✅ 방법 1: class 엔진 (파인스크립트 포팅)\nclass MyStrategy {\n  static run(candles, config) { /* return [{...signal}] */ }\n}\n\n// ✅ 방법 2: function(candles) → 배열 리턴\nfunction myStrategy(candles) {\n  return candles.map(c => ({ time: c.time, long: ..., short: ... }))\n}\n\n// ✅ 방법 3: per-candle (candles, i, c, prev 사용)\nreturn { buyCondition: c.close > high, sellCondition: c.close < low }\n\n// 자동 인식 키: long/short, buy/sell, buyCondition/sellCondition, longSignal/shortSignal`}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-500 resize-y"
          spellCheck={false}
        />
      </div>

      {/* 공개 여부 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPublished !== false}
          onChange={(e) => set("isPublished", e.target.checked)}
          className="accent-cyan-500"
        />
        <span className="text-sm text-gray-300 flex items-center gap-1">
          {form.isPublished !== false
            ? <><Eye className="h-3.5 w-3.5 text-cyan-500" /> 공개</>
            : <><EyeOff className="h-3.5 w-3.5 text-gray-500" /> 비공개</>
          }
        </span>
      </label>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !form.name}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          저장
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors"
        >
          <X className="h-4 w-4" /> 취소
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm px-4 py-2 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> 삭제
          </button>
        )}
      </div>
    </form>
  )
}

/* ─── 입력 필드 헬퍼 ─── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  multiline?: boolean
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
        />
      )}
    </div>
  )
}
