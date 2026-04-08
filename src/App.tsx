import { Header, Hero, Signals, Indicators, Pricing, Philosophy, Footer } from "./components/sections"
import "./App.css"

function App() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-white overflow-hidden">
      <Header />
      <main>
        <Hero />
        <Signals />
        <Indicators />
        <Pricing />
        <Philosophy />
      </main>
      <Footer />
    </div>
  )
}

export default App
