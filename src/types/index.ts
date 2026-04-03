import { type LucideIcon } from "lucide-react"

export interface Signal {
  id?: string
  symbol: string
  date: string
  time: string
  price: string
  position: "LONG" | "SHORT"
  isNew: boolean
  icon: string
  source?: string
}

export interface SystemFeature {
  name: string
  description: string
  icon: LucideIcon
}

export interface Indicator {
  id?: string
  name: string            // 제목
  subtitle: string        // 부제목
  image?: string          // 이미지 URL
  content: string         // 내용 (상세 설명)
  strategyId: string      // 전략 엔진 ID (예: sigma-box, super-target, order-block, rsi-bb)
  strategyCode?: string   // 자바스크립트 전략 코드 (Buy/Sell 조건)
  scores: {               // 구조 성능 프로파일 (5개)
    label: string
    value: number
    max: number
  }[]
  marketFit: {            // 시장 적합도 (5개)
    label: string
    fit: "high" | "mid" | "low"
  }[]
  tags: string[]          // 태그
  createdAt?: string
  updatedAt?: string
}

export interface NavItem {
  href: string
  label: string
}
