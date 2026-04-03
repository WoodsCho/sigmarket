import { useState, useEffect, useCallback } from "react"
import {
  Plus, Trash2, Edit3, Save, X, LogOut,
  Loader2, Eye, EyeOff, ArrowUp, ArrowDown,
} from "lucide-react"
import { signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignIn, setUpTOTP } from "aws-amplify/auth"
import type { Indicator } from "../types"

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
    strategyId: "sigma-box",
    strategyCode: "",
    scores: [
      { label: "", value: 4.5, max: 5.0 },
      { label: "", value: 4.5, max: 5.0 },
      { label: "", value: 4.5, max: 5.0 },
      { label: "", value: 4.5, max: 5.0 },
      { label: "", value: 4.5, max: 5.0 },
    ],
    marketFit: [
      { label: "", fit: "high" },
      { label: "", fit: "high" },
      { label: "", fit: "high" },
      { label: "", fit: "high" },
      { label: "", fit: "high" },
    ],
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

  const handleNextStep = async (nextStep: string) => {
    switch (nextStep) {
      case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
        setStep("newPassword")
        break
      case "CONTINUE_SIGN_IN_WITH_TOTP_SETUP": {
        const totpSetup = await setUpTOTP()
        const uri = totpSetup.getSetupUri("Sigmarket", email)
        setTotpSetupUri(uri.toString())
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
      await handleNextStep(result.nextStep?.signInStep || "DONE")
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
      await handleNextStep(result.nextStep?.signInStep || "DONE")
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
      await handleNextStep(result.nextStep?.signInStep || "DONE")
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
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center">
        <form onSubmit={handleTotpVerify} className={formClass}>
          <h1 className="text-2xl font-bold text-white text-center">MFA 설정</h1>
          <p className="text-gray-400 text-sm text-center">인증 앱(Google Authenticator 등)에서 아래 코드를 등록하세요.</p>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">수동 입력 키:</p>
            <p className="text-cyan-400 text-xs font-mono break-all select-all">{totpSetupUri.split("secret=")[1]?.split("&")[0] || totpSetupUri}</p>
          </div>
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
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

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
            scores: typeof item.scores === "string" ? JSON.parse(item.scores) : item.scores || [],
            marketFit: typeof item.marketFit === "string" ? JSON.parse(item.marketFit) : item.marketFit || [],
            tags: typeof item.tags === "string" ? JSON.parse(item.tags) : item.tags || [],
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

  const setScore = (idx: number, field: "label" | "value", val: string | number) => {
    setForm((prev) => {
      const scores = [...prev.scores]
      scores[idx] = { ...scores[idx], [field]: field === "value" ? Number(val) : val }
      return { ...prev, scores }
    })
  }

  const setFit = (idx: number, field: "label" | "fit", val: string) => {
    setForm((prev) => {
      const marketFit = [...prev.marketFit]
      marketFit[idx] = { ...marketFit[idx], [field]: val }
      return { ...prev, marketFit }
    })
  }

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

      {/* 내용 */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">내용 (content)</label>
        <textarea
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          rows={4}
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
          <span className="text-gray-600 ml-2 text-xs">candles, i, c, prev 변수 사용 가능. buyCondition / sellCondition 반환</span>
        </label>
        <textarea
          value={form.strategyCode || ""}
          onChange={(e) => set("strategyCode", e.target.value)}
          rows={12}
          placeholder={`// 예시: 20봉 고점/저점 돌파 전략\nconst high20 = Math.max(...candles.slice(i - 20, i).map(x => x.high));\nconst low20 = Math.min(...candles.slice(i - 20, i).map(x => x.low));\n\nconst buyCondition = c.close > high20 && prev.close <= high20;\nconst sellCondition = c.close < low20 && prev.close >= low20;\n\nreturn { buyCondition, sellCondition };`}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-500 resize-y"
          spellCheck={false}
        />
      </div>

      {/* 구조 성능 프로파일 (5개) */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-300 mb-3">구조 성능 프로파일 (5개)</legend>
        <div className="space-y-2">
          {form.scores.map((s, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input
                value={s.label}
                onChange={(e) => setScore(i, "label", e.target.value)}
                placeholder={`항목 ${i + 1}`}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={s.value}
                onChange={(e) => setScore(i, "value", e.target.value)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-gray-500">/ 5.0</span>
            </div>
          ))}
        </div>
      </fieldset>

      {/* 시장 적합도 (5개) */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-300 mb-3">시장 적합도 (5개)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {form.marketFit.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={m.label}
                onChange={(e) => setFit(i, "label", e.target.value)}
                placeholder={`시장 ${i + 1}`}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
              <select
                value={m.fit}
                onChange={(e) => setFit(i, "fit", e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="high">High</option>
                <option value="mid">Mid</option>
                <option value="low">Low</option>
              </select>
            </div>
          ))}
        </div>
      </fieldset>

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
