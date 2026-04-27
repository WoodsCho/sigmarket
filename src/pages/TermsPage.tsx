import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const SECTIONS = [
  {
    title: "제1조 (목적)",
    body: `이 약관은 시그마켓(이하 "회사")이 제공하는 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: "제2조 (정의)",
    body: `① "서비스"란 회사가 제공하는 트레이딩 인디케이터 신호, 시그널 현황, 관련 정보 등 일체의 서비스를 의미합니다.\n② "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.\n③ "회원"이란 회사에 개인정보를 제공하여 회원가입을 한 자로서, 회사의 서비스를 계속적으로 이용할 수 있는 자를 말합니다.`,
  },
  {
    title: "제3조 (약관의 효력 및 변경)",
    body: `① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.\n② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지 후 7일이 경과하면 효력이 발생합니다.`,
  },
  {
    title: "제4조 (서비스의 제공 및 변경)",
    body: `① 회사는 다음과 같은 서비스를 제공합니다.\n  - 트레이딩 인디케이터 기반 매매 시그널 제공\n  - 실시간 시그널 현황 조회\n  - 기타 회사가 추가 개발하거나 제휴 계약을 통해 이용자에게 제공하는 일체의 서비스\n② 회사는 서비스의 내용, 품질 향상을 위해 서비스를 변경할 수 있으며, 이 경우 변경된 서비스의 내용과 제공일자를 공지합니다.`,
  },
  {
    title: "제5조 (서비스 이용의 제한)",
    body: `① 회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다.\n  - 타인의 명의를 도용하거나 허위 정보를 기재한 경우\n  - 서비스 운영을 방해하는 행위를 한 경우\n  - 관련 법령에 위반되는 행위를 한 경우`,
  },
  {
    title: "제6조 (투자 책임 면책)",
    body: `① 회사가 제공하는 시그널 및 인디케이터 정보는 투자 권유가 아니며, 단순 참고 정보로만 활용하시기 바랍니다.\n② 본 서비스를 이용한 투자 결과에 대한 책임은 전적으로 이용자 본인에게 있으며, 회사는 이에 대한 손해배상 책임을 지지 않습니다.\n③ 과거의 수익률이 미래의 수익을 보장하지 않습니다.`,
  },
  {
    title: "제7조 (지식재산권)",
    body: `회사가 작성한 저작물에 대한 저작권 기타 지식재산권은 회사에 귀속합니다. 이용자는 회사의 서비스를 이용함으로써 얻은 정보 중 회사에게 지식재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.`,
  },
  {
    title: "제8조 (준거법 및 관할법원)",
    body: `① 이 약관의 해석 및 회사와 이용자 간의 분쟁에 대하여는 대한민국 법을 준거법으로 합니다.\n② 서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.`,
  },
]

export default function TermsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#08061a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate("/signup")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>

        <h1 className="text-2xl font-bold text-white mb-1">서비스 이용약관</h1>
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
