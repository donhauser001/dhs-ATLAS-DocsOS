import { Routes, Route, Link } from 'react-router-dom'
import { GenesisPage } from './pages/genesis'

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">ATLAS Runtime</h1>
        <p className="text-xl text-slate-400 mb-8">ADL 语言的运行环境</p>
        <div className="space-y-2 text-slate-500">
          <p>Phase 0 / Genesis</p>
          <p className="text-sm">让一份 ADL 文档完成完整闭环</p>
        </div>
        <div className="mt-12">
          <Link 
            to="/genesis" 
            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors inline-block"
          >
            进入 Genesis →
          </Link>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/genesis" element={<GenesisPage />} />
    </Routes>
  )
}

export default App
