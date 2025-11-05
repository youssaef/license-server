import { useEffect, useState } from 'react'
import { loadInvoices, loadProducts, loadSettings } from '../store/storage'

export default function Dashboard() {
  const settings = loadSettings()
  const [metrics, setMetrics] = useState({ sales: 0, profit: 0, zakat: 0 })

  useEffect(() => {
    const invoices = loadInvoices()
    const products = loadProducts()
    const map = new Map(products.map((p) => [p.id, p]))

    const sales = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    let profit = 0
    invoices.forEach((inv) => {
      (inv.items || []).forEach((i) => {
        const buy = Number(map.get(i.id)?.buyPrice ?? 0)
        const sell = Number(i.price ?? 0)
        const qty = Number(i.qty || 0)
        profit += Math.max(0, sell - buy) * qty
      })
    })

    const zakat = profit * 0.025 // 2.5%
    setMetrics({ sales, profit, zakat })
  }, [])

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">ملخص</div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg border">
              <div className="text-xs text-gray-500">إجمالي المبيعات</div>
              <div className="text-2xl font-bold text-gray-800">{metrics.sales.toFixed(2)} {settings.currency}</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-xs text-gray-500">الأرباح</div>
              <div className="text-2xl font-bold text-gray-800">{metrics.profit.toFixed(2)} {settings.currency}</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-xs text-gray-500">الزكاة (2.5%)</div>
              <div className="text-2xl font-bold text-gray-800">{metrics.zakat.toFixed(2)} {settings.currency}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">آخر الأنشطة</div>
        <div className="card-body">
          <div className="text-sm text-gray-500">لا توجد أنشطة بعد</div>
        </div>
      </div>
    </div>
  )
}