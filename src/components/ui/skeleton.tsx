import { cn } from "../../lib/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)}
      {...props}
    />
  )
}

/* ─── 시그널 테이블 스켈레톤 ─── */
export function SignalTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-[#0d1117] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
      <div className="overflow-x-auto w-full bg-[#0d1117]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f1420] border-b border-gray-700/50">
              <th className="px-5 py-3"><Skeleton className="h-3 w-8" /></th>
              <th className="px-5 py-3"><Skeleton className="h-3 w-12" /></th>
              <th className="px-5 py-3"><Skeleton className="h-3 w-16" /></th>
              <th className="px-5 py-3"><Skeleton className="h-3 w-14" /></th>
              <th className="px-5 py-3"><Skeleton className="h-3 w-12" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[#0d1117]" : "bg-[#0b0f1a]"}>
                <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-2.5 w-12" />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4"><Skeleton className="h-5 w-24 rounded-lg" /></td>
                <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-5 py-4"><Skeleton className="h-5 w-14 rounded-lg" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── 인디케이터 카드 스켈레톤 ─── */
export function IndicatorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* 이미지 영역 */}
      <Skeleton className="h-72 w-full rounded-none" />
      {/* 컨텐츠 영역 */}
      <div className="px-8 pt-6 pb-7 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
        <div className="pt-4 border-t border-white/[0.04]">
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

export function IndicatorGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {Array.from({ length: count }).map((_, i) => (
        <IndicatorCardSkeleton key={i} />
      ))}
    </div>
  )
}
