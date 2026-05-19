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
  exchange?: string            // 거래소 (예: "Binance", "Bybit", "OKX")
  indicator?: string           // 시그널 지표명 (예: "시그마 메서드 1차눌림")
  timeAgo?: string             // 실시간 알림 텍스트 (예: "방금 전", "3분 전")
  createdAt?: string           // ISO 타임스탬프 (timeAgo 재계산용)
}

export interface SystemFeature {
  name: string
  subtitle?: string
  description: string
  icon: LucideIcon
  color?: string
}

export interface ContentSection {
  title: string                // 섹션 제목
  body: string                 // 본문 (여러 줄 가능)
  layout?: "full" | "half"     // 카드 너비: full(100%) | half(50%) — 기본값 half
  highlight?: string           // 💡 강조 문구
  image?: string               // 섹션 내 이미지 URL (S3)
  imageTransparent?: boolean   // 이미지 투명 배경 (테두리/배경 없이 표시)
  cardTransparent?: boolean    // 카드 자체 투명 배경
  bullets?: string[]           // ● 불릿 리스트
  infoCards?: {                // TP/SL 같은 정보 카드
    badge: string              // 뱃지 텍스트 (예: "TP", "SL")
    badgeColor: "cyan" | "pink" | "purple" | "blue" | "orange" | "emerald"
    title: string
    description: string
  }[]
  gridItems?: string[]         // 그리드 아이템 (상단/중단/하단, 이너라인 같은 것)
  combo?: {                    // 조합 카드 (A + B = C)
    left: { label: string; sub: string }
    right: { label: string; sub: string }
    result: string
  }
}

export interface Indicator {
  id?: string
  name: string            // 제목
  subtitle: string        // 부제목
  description?: string    // 카드 미리보기용 소개 문구
  image?: string          // 이미지 URL
  content: string         // 내용 (레거시, 단순 텍스트)
  sections?: ContentSection[]  // 구조화된 섹션 (신규)
  strategyId: string      // 전략 엔진 ID (예: sigma-box, super-target, order-block, rsi-bb)
  strategyCode?: string   // 자바스크립트 전략 코드 (Buy/Sell 조건)
  scores?: {               // 구조 성능 프로파일 (5개)
    label: string
    value: number
    max: number
  }[]
  marketFit?: {            // 시장 적합도 (5개)
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

export interface RankingEntry {
  rank: number
  symbol: string               // 예: "DOGE/USDT"
  signal: string               // 시그널(지표) 이름: "Sigma Core"
  entryPrice: string           // 진입가
  entryDate: string            // 진입 시점: "03.29 09:15"
  resultPrice: string          // 성과 가격 (LONG: 최고가, SHORT: 최저가)
  position: "LONG" | "SHORT"
  returnPct: number            // 수익률 (예: 44.0)
  color?: "cyan" | "purple" | "pink" | "gray"  // 종목 컬러
}
