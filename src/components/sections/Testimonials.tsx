import { useState, useEffect, useRef } from "react"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"

/* ─── 후기 데이터 ─── */
const TESTIMONIALS = [
  {
    name: "김태현",
    role: "크립토 트레이더 · 3년차",
    avatar: "TH",
    rating: 5,
    text: "시그마 박스와 슈퍼타겟 조합이 진짜 미쳤습니다. 횡보 구간에서 헛된 진입이 확 줄었고, 추세 전환점을 잡는 정확도가 체감될 정도로 올라갔어요. 무료 체험 3일 만에 바로 구독 결정했습니다.",
    highlight: "횡보 구간 헛된 진입이 확 줄었어요",
  },
  {
    name: "이수진",
    role: "해외선물 트레이더 · 5년차",
    avatar: "SJ",
    rating: 5,
    text: "해외선물 NQ, ES 매매에 활용 중인데, 시그마 코어의 스캘핑 시그널이 특히 빠릅니다. 다른 유료 인디케이터 3개를 쓰다가 시그마켓 하나로 통합했어요. 텔레그램 알림도 바로 오니까 차트 앞에 안 붙어있어도 됩니다.",
    highlight: "인디케이터 3개를 하나로 통합",
  },
  {
    name: "박준혁",
    role: "주식 투자자 · 2년차",
    avatar: "JH",
    rating: 5,
    text: "솔직히 보조지표에 회의적이었는데 RSI Band랑 MACD Zero Cross 조합으로 눌림 진입 타이밍을 잡으니까 승률이 눈에 띄게 좋아졌습니다. 특히 주식 스윙 매매에 최적화된 느낌입니다.",
    highlight: "승률이 눈에 띄게 좋아졌습니다",
  },
  {
    name: "정민서",
    role: "FX 트레이더 · 4년차",
    avatar: "MS",
    rating: 5,
    text: "외환 시장 특성상 24시간 돌아가는데, 실시간 시그널 알림이 정말 유용합니다. 오더블록 + FVG 조합으로 기관 매집 구간을 미리 포착할 수 있게 되었고, 손절 라인 설정이 훨씬 명확해졌어요.",
    highlight: "기관 매집 구간을 미리 포착",
  },
  {
    name: "최동욱",
    role: "크립토 스캘퍼 · 1년차",
    avatar: "DW",
    rating: 4,
    text: "초보라서 걱정했는데, 가이드 영상이 잘 되어있고 디스코드에서 질문하면 바로 답변이 옵니다. 시그마 코어로 스캘핑 연습하면서 실력이 많이 늘었어요. 가성비 좋은 서비스입니다.",
    highlight: "초보도 따라하기 쉬운 가이드",
  },
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  // 자동 슬라이드
  useEffect(() => {
    if (!isAutoPlaying) return
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [isAutoPlaying])

  const goTo = (idx: number) => {
    setCurrent(idx)
    setIsAutoPlaying(false)
    // 6초 후 자동재생 복원
    setTimeout(() => setIsAutoPlaying(true), 6000)
  }

  const prev = () => goTo((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  const next = () => goTo((current + 1) % TESTIMONIALS.length)

  const t = TESTIMONIALS[current]

  return (
    <section className="relative min-h-screen md:h-full flex flex-col justify-center overflow-x-hidden py-20">
      {/* bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a081e]/40 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-900/8 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-4xl mx-auto">

          {/* 헤더 */}
          <div className="text-center mb-14">
            <p className="text-sm text-purple-400 font-medium mb-3 uppercase tracking-wider">Testimonials</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">
              실제 트레이더의 <span className="text-gradient">후기</span>
            </h2>
            <p className="text-gray-500 text-base">
              시그마켓을 사용하는 트레이더들의 생생한 이야기
            </p>
          </div>

          {/* 메인 카드 */}
          <div className="relative">
            {/* 외곽 글로우 */}
            <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 lg:p-12 backdrop-blur-sm">

              {/* 인용 아이콘 */}
              <Quote className="w-10 h-10 text-purple-500/20 mb-6" />

              {/* 하이라이트 */}
              <p className="text-lg lg:text-xl font-semibold text-white mb-4 leading-relaxed">
                "{t.highlight}"
              </p>

              {/* 본문 */}
              <p className="text-sm lg:text-base text-gray-400 leading-relaxed mb-8 break-keep">
                {t.text}
              </p>

              {/* 프로필 + 별 */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {/* 아바타 */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>

                {/* 별점 */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 네비게이션 */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              aria-label="이전 후기"
              className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* 도트 인디케이터 */}
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  aria-label={`후기 ${idx + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    idx === current
                      ? "w-6 h-2 bg-gradient-to-r from-cyan-400 to-purple-400"
                      : "w-2 h-2 bg-gray-700 hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="다음 후기"
              className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}
