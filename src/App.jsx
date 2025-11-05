import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Settings from './pages/Settings'
import Sales from './pages/Sales'
import Invoices from './pages/Invoices'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAccessState } from './store/storage'

export default function App() {
  const [access, setAccess] = useState({ allowed: true, reason: 'licensed', trial: null })
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      const state = await getAccessState()
      setAccess(state)
    })()
  }, [])

  const showBlock = access && access.allowed === false

  return (
    <div className="h-screen flex relative">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-4 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      {showBlock && (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card w-[520px]">
            <div className="card-header">انتهت الفترة التجريبية</div>
            <div className="card-body text-sm text-gray-700 space-y-3">
              <div>لا يمكنك الاستمرار بدون تفعيل البرنامج. الرجاء إدخال كود التفعيل المرتبط بجهازك.</div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/settings')}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white"
                >الذهاب إلى صفحة التفعيل</button>
              </div>
              <div className="text-xs text-gray-500">لمزيد من المعلومات تواصل مع المطوّر للحصول على كود التفعيل.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}