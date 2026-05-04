import { principles } from "../../data"

export default function Philosophy() {
  return (
    <section id="philosophy" className="relative h-full flex flex-col justify-center py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a081e] to-transparent" />

      <div className="relative container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-7 mx-auto mb-6" />
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Our <span className="text-gradient">Identity</span>
            </h2>
            <p className="text-gray-500 text-lg">시그마켓의 핵심 원칙</p>
          </div>

          <div className="gradient-border p-[1px] rounded-2xl">
            <div className="bg-[var(--theme-bg-card)] rounded-2xl p-8 lg:p-12">
              <ul className="space-y-8">
                {principles.map((principle, idx) => (
                  <li key={idx} className="flex items-start gap-5 group">
                    <span className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm border border-cyan-500/10">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-lg lg:text-xl text-gray-300 leading-relaxed pt-1.5 group-hover:text-white transition-colors duration-300">{principle}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
