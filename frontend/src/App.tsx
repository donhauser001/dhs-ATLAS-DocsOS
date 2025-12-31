import { Routes, Route } from 'react-router-dom'

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
          <a 
            href="/genesis" 
            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            进入 Genesis →
          </a>
        </div>
      </div>
    </div>
  )
}

function Genesis() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Genesis</h1>
        <p className="text-slate-600 mb-8">Phase 0 - ADL 文档闭环验证</p>
        
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-slate-500 text-center py-12">
            ADL 文档渲染器（待实现）
          </p>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/genesis" element={<Genesis />} />
    </Routes>
  )
}

export default App
