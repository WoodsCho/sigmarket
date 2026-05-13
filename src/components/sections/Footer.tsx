import { navItems } from "../../data"

export default function Footer() {
  return (
    <footer className="relative min-h-[100dvh] md:h-full flex flex-col justify-center border-t border-white/5">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-700/30 to-transparent" />

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <img src="/images/sigmarket-logo.png" alt="시그마켓" className="h-6 mb-4" />
              <p className="text-gray-500 text-s leading-relaxed max-w-xs">
                TradingView 기반 커스텀 인디케이터 & 실시간 시그널 시스템
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="relative text-sm text-gray-500 hover:text-white transition-colors duration-300 group">
                      {item.label}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-cyan-500 to-transparent group-hover:w-full transition-all duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Connect</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-gray-500 hover:text-[#0088cc] transition-all duration-300 flex items-center gap-2 group">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 group-hover:scale-110 transition-transform duration-300">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                    Telegram
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-500 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 group-hover:scale-110 transition-transform duration-300">
                      <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
                    </svg>
                    Twitter / X
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">
              &copy; {new Date().getFullYear()} 시그마켓. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
