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
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  plan: "free",
  isLoading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [plan, setPlan] = useState<Plan>("free")
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const current = await getCurrentUser()
      setUser(current)
      const session = await fetchAuthSession({ forceRefresh: true })
      const groups = (session.tokens?.idToken?.payload?.["cognito:groups"] as string[]) || []
      console.log("[AuthContext] refreshUser groups:", groups, "idToken payload:", session.tokens?.idToken?.payload)
      setIsAdmin(groups.includes("admin"))
      if (groups.includes("professional")) setPlan("professional")
      else if (groups.includes("standard")) setPlan("standard")
      else setPlan("free")
    } catch {
      setUser(null)
      setIsAdmin(false)
      setPlan("free")
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))

    // 로그인/로그아웃 이벤트 감지 → 상태 즉시 반영
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        refreshUser()
      } else if (payload.event === "signedOut") {
        setUser(null)
      }
    })

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
