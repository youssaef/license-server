import { useEffect, useMemo, useRef, useState } from 'react'
import { loadProducts, loadCustomers, loadSettings, loadInvoices, saveInvoices, uid } from '../store/storage'

export default function Sales() {
  const settings = loadSettings()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [q, setQ] = useState('')
  const [cart, setCart] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('paid') // 'paid' | 'debt'

  useEffect(() => { setProducts(loadProducts()); setCustomers(loadCustomers()) }, [])

  const addToCart = (p) => {
    setCart((c) => {
      const idx = c.findIndex((i) => i.id === p.id)
      if (idx >= 0) {
        const next = [...c]; next[idx] = { ...next[idx], qty: next[idx].qty + 1 }; return next
      }
      const price = Number(p.sellPrice ?? p.price) || 0
      return [...c, { id: p.id, name: p.name, price, qty: 1 }]
    })
  }

  const setQty = (id, qty) => setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)))
  const remove = (id) => setCart((c) => c.filter((i) => i.id !== id))
  const clear = () => setCart([])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return products
    return products.filter((p) => [p.name, p.sku, p.category].some((v) => (v || '').toLowerCase().includes(s)))
  }, [products, q])

  // إدخال مخفي لالتقاط الباركود من الماسح دون التأثير على قائمة المنتجات
  const scanRef = useRef(null)
  const [scanCode, setScanCode] = useState('')
  useEffect(() => { scanRef.current?.focus() }, [])
  const onScanKeyDown = (e) => {
    if (e.key === 'Enter') {
      const code = scanCode.trim()
      if (code) {
        const exactBySku = products.find((p) => String(p.sku || '').trim() === code)
        const byName = products.find((p) => String(p.name || '').trim().toLowerCase() === code.toLowerCase())
        const target = exactBySku || byName
        if (target) addToCart(target)
      }
      setScanCode('')
      if (scanRef.current) scanRef.current.value = ''
    } else if (e.key === 'Backspace') {
      setScanCode((s) => s.slice(0, -1))
    } else if (e.key.length === 1) {
      setScanCode((s) => s + e.key)
    }
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)

  const submitSale = () => {
    if (cart.length === 0) return
    if (paymentStatus === 'debt' && !customerId) {
      alert('لتسجيل دين يجب اختيار زبون محدد')
      return
    }
    const cust = customers.find((c) => c.id === customerId) || null
    const invoice = {
      id: uid(),
      date: new Date().toISOString(),
      customer: cust ? { id: cust.id, name: cust.name, phone: cust.phone } : null,
      items: cart,
      total: subtotal,
      status: paymentStatus, // 'paid' أو 'debt'
      paidAmount: paymentStatus === 'paid' ? subtotal : 0,
      payments: paymentStatus === 'paid'
        ? [{ amount: subtotal, date: new Date().toISOString(), note: 'سداد كامل عند الإنشاء' }]
        : [],
    }
    const all = loadInvoices()
    saveInvoices([invoice, ...all])
    clear()
    alert('تم إنشاء الفاتورة بنجاح')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card">
        <div className="card-header">المنتجات</div>
        <div className="card-body space-y-3">
          {/* إدخال مخفي لالتقاط الباركود من الماسح */}
          <input ref={scanRef} onKeyDown={onScanKeyDown} aria-hidden="true" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
          {/* خانة البحث اليدوية لا تؤثر عليها قراءات الماسح */}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم/رمز/فئة" className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)} className="text-left p-3 rounded-lg border hover:bg-gray-50">
                <div className="font-semibold text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500">{p.category}</div>
                <div className="mt-1 text-primary-700 text-sm">{Number(p.sellPrice ?? p.price).toFixed(2)} {settings.currency}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-sm text-gray-500">لا توجد منتجات مطابقة</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">سلة البيع</div>
        <div className="card-body space-y-3">
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2">
            <option value="">زبون نقدي</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">طريقة الدفع</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2">
                <option value="paid">مسدد (مدفوع)</option>
                <option value="debt">دين (آجل)</option>
              </select>
              {paymentStatus === 'debt' && !customerId && (
                <div className="text-xs text-red-600 mt-1">يجب اختيار زبون لتسجيل الدين</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {cart.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{i.name}</div>
                  <div className="text-xs text-gray-500">{i.price.toFixed(2)} {settings.currency}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={i.qty} onChange={(e) => setQty(i.id, Number(e.target.value))} className="w-20 rounded-lg border px-2 py-1" />
                  <button onClick={() => remove(i.id)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs">حذف</button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-sm text-gray-500">السلة فارغة</div>}
          </div>

          <div className="flex items-center justify-between border-t pt-2">
            <div className="text-sm text-gray-600">الإجمالي</div>
            <div className="text-lg font-bold text-gray-800">{subtotal.toFixed(2)} {settings.currency}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={submitSale} className="px-4 py-2 rounded-lg bg-primary-600 text-white">إنشاء فاتورة</button>
            <button onClick={clear} className="px-4 py-2 rounded-lg border">تفريغ السلة</button>
          </div>
        </div>
      </div>
    </div>
  )
}