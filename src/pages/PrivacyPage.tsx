import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const SECTIONS = [
  {
    title: "제1조 (수집하는 개인정보 항목)",
    body: `회사는 회원가입 및 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.\n\n[필수 항목]\n  - 이메일 주소\n  - 서비스 이용 기록 (로그인 일시, 접속 IP)\n\n[자동 수집 항목]\n  - 쿠키, 서비스 이용 기록, 접속 로그`,
  },
  {
    title: "제2조 (개인정보의 수집 및 이용 목적)",
    body: `수집한 개인정보는 다음의 목적을 위해 활용합니다.\n  - 회원 식별 및 본인 확인\n  - 서비스 제공 및 운영\n  - 공지사항 및 서비스 관련 안내 발송\n  - 불법·부정 이용 방지 및 서비스 보안 유지`,
  },
  {
    title: "제3조 (개인정보의 보유 및 이용 기간)",
    body: `회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관련 법령에 따라 보존할 필요가 있는 경우에는 아래와 같이 일정 기간 보존합니다.\n\n  - 전자상거래 계약·청약 철회 기록: 5년 (전자상거래법)\n  - 소비자 불만·분쟁 처리 기록: 3년 (전자상거래법)\n  - 로그인 기록: 3개월 (통신비밀보호법)`,
  },
  {
    title: "제4조 (개인정보의 제3자 제공)",
    body: `회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.\n  - 이용자가 사전에 동의한 경우\n  - 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우`,
  },
  {
    title: "제5조 (개인정보 처리 위탁)",
    body: `회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.\n\n  - 수탁업체: Amazon Web Services, Inc.\n  - 위탁 업무 내용: 서버 인프라 운영 및 데이터 보관 (AWS Cognito, DynamoDB)\n  - 보유 및 이용 기간: 서비스 이용 계약 기간 중`,
  },
  {
    title: "제6조 (이용자의 권리)",
    body: `이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.\n  - 개인정보 열람 요구\n  - 오류 등이 있을 경우 정정 요구\n  - 삭제 요구\n  - 처리 정지 요구\n\n위 권리 행사는 서비스 내 계정 설정 또는 고객센터를 통해 요청하실 수 있으며, 회사는 지체 없이 조치하겠습니다.`,
  },
  {
    title: "제7조 (개인정보의 파기)",
    body: `회사는 개인정보 보유 기간이 경과하거나 처리 목적이 달성되었을 때에는 지체 없이 해당 개인정보를 파기합니다.\n  - 전자적 파일 형태: 복구 및 재생이 불가능한 방법으로 영구 삭제\n  - 종이 문서: 분쇄기로 분쇄 또는 소각`,
  },
  {
    title: "제8조 (개인정보 보호책임자)",
    body: `회사는 개인정보 처리에 관한 업무를 총괄하는 개인정보 보호책임자를 지정하고 있습니다.\n\n  - 성명: 시그마켓 운영팀\n  - 연락처: support@sigmarket.io`,
  },
  {
    title: "제9조 (개인정보처리방침 변경)",
    body: `이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 서비스 내 공지사항을 통하여 고지할 것입니다.`,
  },
]

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] bg-[#08061a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate("/signup")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>

        <h1 className="text-2xl font-bold text-white mb-1">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mb-10">시행일: 2026년 1월 1일</p>

        <p className="text-sm text-white leading-relaxed mb-10 p-4 bg-gray-800/30 border border-gray-700/40 rounded-xl">
          시그마켓(이하 "회사")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하기 위하여 노력합니다. 회사는 개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 목적과 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
        </p>

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
