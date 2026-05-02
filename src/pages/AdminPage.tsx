import { useState, useEffect, useCallback } from "react"
import {
  Plus, Trash2, Edit3, Save, X, LogOut,
  Loader2, Eye, EyeOff, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, GripVertical,
} from "lucide-react"
import { signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignIn } from "aws-amplify/auth"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import type { Indicator, ContentSection } from "../types"

/* ─── 환경 변수 ─── */
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || ""
const API_URL = import.meta.env.VITE_INDICATORS_API_URL
  || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/indicators` : "")

/* ─── 빈 인디케이터 템플릿 ─── */
function emptyIndicator(): Indicator {
  return {
    name: "",
    subtitle: "",
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
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
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
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
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
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
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
    <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
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
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
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
    <div className="min-h-screen bg-[var(--theme-bg)] text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-[var(--theme-bg)]/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-cyan-500">Σ</span> Indicator Admin
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
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
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
      </main>
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
        <Field label="이미지 URL" value={form.image || ""} onChange={(v) => set("image", v)} placeholder="https://..." />
        <Field label="태그 (쉼표 구분)" value={tagInput} onChange={setTagInput} placeholder="주식, 해외선물, 코인" />
      </div>

      {/* 이미지 미리보기 */}
      {form.image && (
        <div className="w-full h-40 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
          <img src={form.image} alt="preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* ═══ 상세 설명 섹션 에디터 ═══ */}
      <fieldset className="space-y-4">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-gray-300">상세 설명 섹션</legend>
          <button
            type="button"
            onClick={() => {
              const sections = [...(form.sections || [])]
              sections.push({ title: "", body: "", highlight: "", bullets: [], infoCards: [], gridItems: [] })
              set("sections", sections)
            }}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> 섹션 추가
          </button>
        </div>

        {(!form.sections || form.sections.length === 0) && (
          <div className="text-center py-8 border border-dashed border-zinc-700 rounded-xl">
            <p className="text-gray-500 text-sm mb-3">아직 섹션이 없습니다</p>
            <button
              type="button"
              onClick={() => set("sections", [{ title: "", body: "", highlight: "", bullets: [], infoCards: [], gridItems: [] }])}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              + 첫 섹션 만들기
            </button>
          </div>
        )}

        {(form.sections || []).map((section, si) => (
          <SectionEditor
            key={si}
            index={si}
            section={section}
            total={(form.sections || []).length}
            onChange={(updated) => {
              const sections = [...(form.sections || [])]
              sections[si] = updated
              set("sections", sections)
            }}
            onDelete={() => {
              const sections = [...(form.sections || [])]
              sections.splice(si, 1)
              set("sections", sections)
            }}
            onMoveUp={si > 0 ? () => {
              const sections = [...(form.sections || [])]
              ;[sections[si - 1], sections[si]] = [sections[si], sections[si - 1]]
              set("sections", sections)
            } : undefined}
            onMoveDown={si < (form.sections || []).length - 1 ? () => {
              const sections = [...(form.sections || [])]
              ;[sections[si], sections[si + 1]] = [sections[si + 1], sections[si]]
              set("sections", sections)
            } : undefined}
          />
        ))}
      </fieldset>

      {/* 카드 간략 설명 (content) — 목록 카드에 표시되는 짧은 소개 */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          카드 설명 (content)
          <span className="text-gray-600 ml-2 text-xs">커스텀 보조지표 목록 카드에 표시되는 짧은 소개</span>
        </label>
        <textarea
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          rows={4}
          placeholder="카드에 표시될 간략한 설명을 입력하세요"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 resize-y"
        />
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

/* ─── 섹션 에디터 ─── */
function SectionEditor({
  index,
  section,
  total: _total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  index: number
  section: ContentSection
  total: number
  onChange: (s: ContentSection) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const colorLabels = ["cyan", "pink", "purple", "blue", "orange", "emerald"] as const

  const update = <K extends keyof ContentSection>(key: K, val: ContentSection[K]) =>
    onChange({ ...section, [key]: val })

  return (
    <div className="border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900/50">
      {/* 헤더 */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-zinc-900 cursor-pointer hover:bg-zinc-800/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-0.5">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp?.() }} disabled={!onMoveUp} className="text-gray-500 hover:text-white disabled:opacity-20">
            <ChevronUp className="h-3 w-3" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown?.() }} disabled={!onMoveDown} className="text-gray-500 hover:text-white disabled:opacity-20">
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <GripVertical className="h-4 w-4 text-gray-600" />
        <span className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-cyan-400">{index + 1}</span>
        <span className="text-sm font-medium text-white flex-1 truncate">
          {section.title || `섹션 ${index + 1}`}
        </span>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-gray-500 hover:text-red-400 transition-colors p-1">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">섹션 제목</label>
            <input
              value={section.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="예: 한눈에 보이는 가격의 흐름"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* 레이아웃 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">카드 너비</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update("layout", "half")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  (!section.layout || section.layout === "half")
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-zinc-900 border-zinc-700 text-gray-400 hover:border-zinc-600"
                }`}
              >
                ◧ 50% (반쪽)
              </button>
              <button
                type="button"
                onClick={() => update("layout", "full")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  section.layout === "full"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                    : "bg-zinc-900 border-zinc-700 text-gray-400 hover:border-zinc-600"
                }`}
              >
                ▣ 100% (전체)
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">본문</label>
            <textarea
              value={section.body}
              onChange={(e) => update("body", e.target.value)}
              rows={3}
              placeholder="설명 텍스트를 입력하세요..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 resize-y"
            />
          </div>

          {/* 💡 강조 문구 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">💡 강조 문구 (선택)</label>
            <input
              value={section.highlight || ""}
              onChange={(e) => update("highlight", e.target.value)}
              placeholder='예: "단기 신호가 장기 흐름과 같은 방향인지" 즉각적으로 체크할 수 있습니다.'
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* ● 불릿 리스트 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">● 불릿 리스트 (선택)</label>
              <button
                type="button"
                onClick={() => update("bullets", [...(section.bullets || []), ""])}
                className="text-[10px] text-cyan-400 hover:text-cyan-300"
              >
                + 추가
              </button>
            </div>
            {(section.bullets || []).map((b, bi) => (
              <div key={bi} className="flex gap-2 mb-1.5">
                <span className="text-cyan-400 text-sm mt-1.5">●</span>
                <input
                  value={b}
                  onChange={(e) => {
                    const bullets = [...(section.bullets || [])]
                    bullets[bi] = e.target.value
                    update("bullets", bullets)
                  }}
                  placeholder="불릿 항목"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const bullets = [...(section.bullets || [])]
                    bullets.splice(bi, 1)
                    update("bullets", bullets)
                  }}
                  className="text-gray-600 hover:text-red-400 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* 그리드 아이템 (상단/중단/하단 같은 박스들) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">그리드 아이템 (선택)</label>
              <button
                type="button"
                onClick={() => update("gridItems", [...(section.gridItems || []), ""])}
                className="text-[10px] text-cyan-400 hover:text-cyan-300"
              >
                + 추가
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(section.gridItems || []).map((g, gi) => (
                <div key={gi} className="flex gap-1">
                  <input
                    value={g}
                    onChange={(e) => {
                      const gridItems = [...(section.gridItems || [])]
                      gridItems[gi] = e.target.value
                      update("gridItems", gridItems)
                    }}
                    placeholder="예: 상단 / 중단 / 하단"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const gridItems = [...(section.gridItems || [])]
                      gridItems.splice(gi, 1)
                      update("gridItems", gridItems)
                    }}
                    className="text-gray-600 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* TP/SL 정보 카드 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">정보 카드 — TP / SL 등 (선택)</label>
              <button
                type="button"
                onClick={() => update("infoCards", [...(section.infoCards || []), { badge: "TP", badgeColor: "cyan", title: "", description: "" }])}
                className="text-[10px] text-cyan-400 hover:text-cyan-300"
              >
                + 추가
              </button>
            </div>
            {(section.infoCards || []).map((card, ci) => (
              <div key={ci} className="flex gap-2 mb-2 p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <input
                    value={card.badge}
                    onChange={(e) => {
                      const infoCards = [...(section.infoCards || [])]
                      infoCards[ci] = { ...infoCards[ci], badge: e.target.value }
                      update("infoCards", infoCards)
                    }}
                    placeholder="TP"
                    className="w-14 bg-zinc-800 border border-zinc-600 rounded px-1.5 py-1 text-white text-xs text-center focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={card.badgeColor}
                    onChange={(e) => {
                      const infoCards = [...(section.infoCards || [])]
                      infoCards[ci] = { ...infoCards[ci], badgeColor: e.target.value as typeof card.badgeColor }
                      update("infoCards", infoCards)
                    }}
                    className="w-14 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-white text-[10px] focus:outline-none"
                  >
                    {colorLabels.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    value={card.title}
                    onChange={(e) => {
                      const infoCards = [...(section.infoCards || [])]
                      infoCards[ci] = { ...infoCards[ci], title: e.target.value }
                      update("infoCards", infoCards)
                    }}
                    placeholder="카드 제목 (예: 확장라인 Extension Line)"
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    value={card.description}
                    onChange={(e) => {
                      const infoCards = [...(section.infoCards || [])]
                      infoCards[ci] = { ...infoCards[ci], description: e.target.value }
                      update("infoCards", infoCards)
                    }}
                    placeholder="카드 설명"
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const infoCards = [...(section.infoCards || [])]
                    infoCards.splice(ci, 1)
                    update("infoCards", infoCards)
                  }}
                  className="text-gray-600 hover:text-red-400 self-start"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* 조합 카드 (A + B = C) */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">조합 표시 — A + B = C (선택)</label>
            {section.combo ? (
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input value={section.combo.left.label} onChange={(e) => update("combo", { ...section.combo!, left: { ...section.combo!.left, label: e.target.value } })} placeholder="라벨 (예: 방향)" className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-500 mb-1" />
                    <input value={section.combo.left.sub} onChange={(e) => update("combo", { ...section.combo!, left: { ...section.combo!.left, sub: e.target.value } })} placeholder="하위 (예: Sigma Box)" className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-gray-400 text-[10px] focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <input value={section.combo.right.label} onChange={(e) => update("combo", { ...section.combo!, right: { ...section.combo!.right, label: e.target.value } })} placeholder="라벨 (예: 타이밍)" className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-500 mb-1" />
                    <input value={section.combo.right.sub} onChange={(e) => update("combo", { ...section.combo!, right: { ...section.combo!.right, sub: e.target.value } })} placeholder="하위 (예: RSI Spectrum)" className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-gray-400 text-[10px] focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <input value={section.combo.result} onChange={(e) => update("combo", { ...section.combo!, result: e.target.value })} placeholder="결과 (예: 단순해진 판단)" className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
                <button type="button" onClick={() => update("combo", undefined)} className="text-[10px] text-red-400 hover:text-red-300">조합 삭제</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => update("combo", { left: { label: "", sub: "" }, right: { label: "", sub: "" }, result: "" })}
                className="text-[10px] text-cyan-400 hover:text-cyan-300"
              >
                + 조합 추가
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 입력 필드 헬퍼 ─── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
      />
    </div>
  )
}
