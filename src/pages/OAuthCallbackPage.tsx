import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth"

export default function OAuthCallbackPage() {
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    const tryGetUser = async (retries = 5): Promise<void> => {
      try {
        const session = await fetchAuthSession({ forceRefresh: true })
        await getCurrentUser()
        const groups = (session.tokens?.idToken?.payload?.["cognito:groups"] as string[]) || []
        const isAdmin = groups.includes("admin")
        // navigate 대신 location.replace 사용 → React DOM 충돌 방지
        window.location.replace(isAdmin ? "/admin" : "/")
      } catch (err) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000))
          return tryGetUser(retries - 1)
        }
        console.error("[OAuthCallback] 로그인 실패:", err)
        window.location.replace("/login")
      }
    }

    tryGetUser()
  }, [])

  return (
    <div className="min-h-screen bg-[#08061a] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      <p className="text-gray-400 text-sm">로그인 처리 중...</p>
    </div>
  )
}
