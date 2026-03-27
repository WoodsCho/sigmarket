import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { systemFeatures } from "../../data"
import type { SystemFeature } from "../../types"
import StrategyChart from "../StrategyChart"

export default function System() {
  return (
    <section id="system" className="relative py-24">
      {/* Section bg glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.05)_0%,_transparent_70%)]" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 text-xs uppercase tracking-wider font-semibold mb-6">
              No.1 Project
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient">시그널 엔진</span> 구조
            </h2>
            <p className="text-gray-500 text-sm">전략을 선택하면 해당 조건에 맞는 시그널이 차트에 표시됩니다</p>
          </div>

          <StrategyChart />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {systemFeatures.map((feature, idx) => (
              <FeatureCard key={idx} feature={feature} idx={idx} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature, idx }: { feature: SystemFeature; idx: number }) {
  const Icon = feature.icon
  const gradients = [
    "from-emerald-500/20 to-cyan-500/20",
    "from-blue-500/20 to-purple-500/20",
    "from-orange-500/20 to-red-500/20",
  ]
  const iconColors = ["text-emerald-400", "text-blue-400", "text-orange-400"]
  const glows = [
    "hover:shadow-emerald-500/10",
    "hover:shadow-blue-500/10",
    "hover:shadow-orange-500/10",
  ]

  return (
    <Card className={`glass-card glass-card-hover border-0 rounded-2xl transition-all duration-500 hover:shadow-2xl ${glows[idx]} hover:-translate-y-1`}>
      <CardHeader>
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradients[idx]} flex items-center justify-center mb-4`}>
          <Icon className={`h-6 w-6 ${iconColors[idx]}`} />
        </div>
        <CardTitle className="text-xl mb-2">{feature.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 leading-relaxed whitespace-pre-line text-sm">{feature.description}</p>
      </CardContent>
    </Card>
  )
}
