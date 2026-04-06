import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { systemFeatures } from "../../data"
import type { SystemFeature } from "../../types"

export default function System() {
  return (
    <section id="system" className="relative py-16">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-cyan-700/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-gray-500 text-sm tracking-widest mb-10 font-medium">
            단순한 지표가 아닌, 판단을 자동화하는 5개의 기어입니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 구조와 방향 */}
            <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-md hover:border-cyan-500/50 transition-colors group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
                  <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM14 8C15.1046 8 16 8.89543 16 10C16 11.1046 15.1046 12 14 12C12.8954 12 12 11.1046 12 10C12 8.89543 12.8954 8 14 8Z" fill="currentColor" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-1">구조와 방향</h4>
              <p className="text-cyan-400 text-sm font-semibold mb-4 tracking-wide">SIGMA BOX & TREND</p>
              <p className="text-gray-400 text-sm leading-relaxed break-keep">
                시그마 박스 돌파 타점과 지지/저항, 그리고 추세를 한눈에 파악합니다. 흔들림 없는 완벽한 TP/SL 기준을 제시합니다.
              </p>
            </div>

            {/* 타이밍과 패턴 */}
            <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-md hover:border-purple-500/50 transition-colors group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                  <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM14 8C15.1046 8 16 8.89543 16 10C16 11.1046 15.1046 12 14 12C12.8954 12 12 11.1046 12 10C12 8.89543 12.8954 8 14 8Z" fill="currentColor" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-1">타이밍과 패턴</h4>
              <p className="text-purple-400 text-sm font-semibold mb-4 tracking-wide">RSI SPECTRUM & METHOD</p>
              <p className="text-gray-400 text-sm leading-relaxed break-keep">
                노이즈를 제거하고 고유의 패턴 알고리즘으로 타이밍을 압축합니다. 스캘핑부터 스윙까지, 정밀한 진입 타점을 설계합니다.
              </p>
            </div>

            {/* 극대화된 속도 */}
            <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-md hover:border-pink-500/50 transition-colors group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pink-400">
                  <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM14 8C15.1046 8 16 8.89543 16 10C16 11.1046 15.1046 12 14 12C12.8954 12 12 11.1046 12 10C12 8.89543 12.8954 8 14 8Z" fill="currentColor" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-1">극대화된 속도</h4>
              <p className="text-pink-400 text-sm font-semibold mb-4 tracking-wide">SIGMA CORE</p>
              <p className="text-gray-400 text-sm leading-relaxed break-keep">
                가격이 폭발하는 찰나의 기회를 놓치지 않습니다. 짧은 호흡의 스캘핑에 특화된, 가장 빠른 속도의 코어 엔진입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
