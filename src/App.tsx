import { Header, Hero, Signals, System, Indicators, Philosophy, Footer } from "./components/sections"
import "./App.css"

function App() {
  return (
    <div className="min-h-screen bg-[#050a14] text-white overflow-hidden">
      <Header />
      <main>
        <Hero />
        <Signals />
        <System />
        <Indicators />
        <Philosophy />
      </main>
      <Footer />
    </div>
  )
}

export default App
