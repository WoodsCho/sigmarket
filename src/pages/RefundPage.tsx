import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const SECTIONS = [
  {
    title: "제1조 (환불 정책 개요)",
    body: `시그마켓(이하 "회사")은 이용자의 권익 보호를 위해 아래와 같은 환불 정책을 운영합니다. 본 정책은 전자상거래 등에서의 소비자보호에 관한 법률 및 관련 법령에 따릅니다.`,
  },
  {
    title: "제2조 (구독 서비스 환불)",
    body: `① 월간 구독의 경우, 결제일로부터 7일 이내에 서비스를 이용하지 않은 경우 전액 환불이 가능합니다.\n② 연간 구독의 경우, 결제일로부터 7일 이내 전액 환불이 가능합니다.\n③ 결제일로부터 7일이 경과한 경우, 잔여 이용 기간에 해당하는 금액을 일할 계산하여 환불합니다.\n④ 서비스를 실질적으로 이용한 경우(시그널 조회, 인디케이터 사용 등)에는 환불이 제한될 수 있습니다.`,
  },
  {
    title: "제3조 (환불 불가 사유)",
    body: `다음 각 호에 해당하는 경우 환불이 불가능합니다.\n  - 이용자의 귀책 사유로 서비스 이용이 불가능하게 된 경우\n  - 이용자가 서비스 이용 규정을 위반하여 이용이 제한된 경우\n  - 디지털 콘텐츠를 다운로드하거나 열람한 경우\n  - 프로모션·이벤트로 무상 제공된 서비스 기간`,
  },
  {
    title: "제4조 (환불 절차)",
    body: `① 환불을 원하시는 경우 고객센터(이메일 또는 텔레그램)로 아래 정보를 포함하여 요청해 주세요.\n  - 회원 이메일 주소\n  - 결제 일시 및 결제 금액\n  - 환불 사유\n② 환불 요청 접수 후 영업일 기준 3~5일 이내에 검토 결과를 안내해 드립니다.\n③ 환불 승인 시 결제 수단으로 영업일 기준 3~7일 이내에 환불됩니다.`,
  },
  {
    title: "제5조 (부분 환불)",
    body: `월간 또는 연간 구독 중도 해지 시, 이미 사용한 기간에 해당하는 금액(일할 계산)을 제외하고 나머지 금액을 환불합니다.\n\n환불 금액 = 결제 금액 × (잔여 일수 / 총 구독 일수)`,
  },
  {
    title: "제6조 (문의처)",
    body: `환불 관련 문의는 아래로 연락해 주세요.\n\n  - 이메일: support@sigmarket.co.kr\n  - 운영 시간: 평일 10:00 ~ 18:00 (주말·공휴일 제외)\n\n회사는 이용자의 환불 요청에 성실히 응하며, 분쟁이 발생할 경우 소비자분쟁해결기준에 따라 처리합니다.`,
  },
]

export default function RefundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] bg-[#08061a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>

        <h1 className="text-2xl font-bold text-white mb-1">환불 정책</h1>
        <p className="text-sm text-gray-500 mb-10">시행일: 2026년 1월 1일</p>

        <div className="flex flex-col gap-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-sm font-semibold text-cyan-400 mb-2">{s.title}</h2>
              <p className="text-sm text-white leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
