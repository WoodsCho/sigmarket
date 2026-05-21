import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentUser, signOut as amplifySignOut, fetchAuthSession } from "aws-amplify/auth"
import { Hub } from "aws-amplify/utils"
import type { AuthUser } from "aws-amplify/auth"

export type Plan = "free" | "standard" | "professional"

interface AuthContextValue {
  user: AuthUser | null
  isAdmin: boolean
  plan: Plan
  isLoading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  plan: "free",
  isLoading: true,
  signOut: async () => {},
  refreshUser: async () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [plan, setPlan] = useState<Plan>("free")
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async (): Promise<boolean> => {
    try {
      const current = await getCurrentUser()
      setUser(current)
      const session = await fetchAuthSession({ forceRefresh: true })
      const groups = (session.tokens?.idToken?.payload?.["cognito:groups"] as string[]) || []
      const admin = groups.includes("admin")
      setIsAdmin(admin)
      if (groups.includes("professional")) setPlan("professional")
      else if (groups.includes("standard")) setPlan("standard")
      else setPlan("free")
      return admin
    } catch {
      setUser(null)
      setIsAdmin(false)
      setPlan("free")
      return false
    }
  }

  useEffect(() => {
    // Hub 리스너 먼저 등록
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      console.log("[AuthContext] Hub event:", payload.event)
      switch (payload.event) {
        case "signedIn":
        case "signInWithRedirect":
          // OAuth 콜백 후 URL 정리하고 유저 로드
          refreshUser().finally(() => {
            setIsLoading(false)
            // URL에서 code/state 파라미터 제거
            const url = new URL(window.location.href)
            if (url.searchParams.has("code") || url.searchParams.has("state")) {
              url.searchParams.delete("code")
              url.searchParams.delete("state")
              window.history.replaceState({}, "", url.toString())
            }
          })
          break
        case "signInWithRedirect_failure":
          console.error("[AuthContext] OAuth 로그인 실패:", payload.data)
          setIsLoading(false)
          break
        case "signedOut":
          setUser(null)
          setIsAdmin(false)
          setPlan("free")
          break
      }
    })

    // OAuth 콜백이면 Hub 이벤트를 기다림 (Amplify가 code 처리 중)
    const params = new URLSearchParams(window.location.search)
    if (params.has("code")) {
      // Amplify가 자동으로 토큰 교환 → signedIn 이벤트 발생
      // isLoading은 Hub 이벤트 처리 후 false로 변경됨
      // 혹시 이벤트를 놓쳤을 경우를 위한 폴백
      const fallback = setTimeout(() => {
        refreshUser().finally(() => setIsLoading(false))
      }, 3000)
      return () => { clearTimeout(fallback); unsubscribe() }
    }

    refreshUser().finally(() => setIsLoading(false))
    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await amplifySignOut()
    setUser(null)
    setIsAdmin(false)
    setPlan("free")
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, plan, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
