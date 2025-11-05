import { useEffect, useMemo, useState, useRef } from 'react'
import ProductForm from '../components/ProductForm'
import { loadProducts, saveProducts, uid } from '../store/storage'

export default function Products() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    setItems(loadProducts())
  }, [])

  useEffect(() => {
    saveProducts(items)
  }, [items])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((p) =>
      [p.name, p.sku, p.category].some((v) => (v || '').toLowerCase().includes(s))
    )
  }, [items, q])

  const addNew = (data) => {
    setItems((old) => [{ id: uid(), ...data }, ...old])
    setEditing(null)
  }

  const update = (data) => {
    setItems((old) => old.map((p) => (p.id === editing.id ? { ...editing, ...data } : p)))
    setEditing(null)
  }

  const remove = (id) => setItems((old) => old.filter((p) => p.id !== id))

  const exportCSV = () => {
    // نصدر المنتجات بصيغة CSV مع BOM لدعم فتح العربية في Excel
    const headers = ['الاسم', 'SKU', 'الفئة', 'السعر', 'المخزون']
    const escape = (val) => {
      const s = String(val ?? '')
      const needsQuotes = /[",\n;]/.test(s)
      const escaped = s.replace(/"/g, '""')
      return needsQuotes ? '"' + escaped + '"' : escaped
    }
    const rows = items.map((p) => [p.name, p.sku || '', p.category || '', Number(p.price).toFixed(2), p.stock || 0])
    // نستخدم الفاصلة أو الفاصلة المنقوطة؟ سنستخدم الفاصلة بما أنها قياسية، ويمكن تغييرها لاحقاً
    const delim = ','
    const csv = [headers.map(escape).join(delim), ...rows.map((r) => r.map(escape).join(delim))].join('\n')
    const bom = '\ufeff' // BOM لإجبار Excel على تفسير UTF-8
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    a.download = `products-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length === 0) return []
    const headerLine = lines[0]
    const delim = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ';' : ','
    const headers = headerLine.split(delim).map((h) => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map((line) => {
      const cols = line.split(delim).map((c) => c.trim().replace(/^"|"$/g, ''))
      const obj = {}
      headers.forEach((h, i) => { obj[h] = cols[i] ?? '' })
      return obj
    })
  }

  const normalizeProduct = (raw) => {
    const name = (raw.name || raw["اسم المنتج"] || '').trim()
    const sku = (raw.sku || raw["الرمز"] || raw["SKU"] || '').trim()
    const category = (raw.category || raw["الفئة"] || '').trim()
    const buyNum = Number(raw.buyPrice ?? raw["سعر الشراء"] ?? 0)
    const sellNum = Number(raw.sellPrice ?? raw["سعر البيع"] ?? raw.price ?? raw["السعر"] ?? 0)
    const stockNum = Number(raw.stock ?? raw["المخزون"] ?? 0)
    return {
      name,
      sku,
      category,
      buyPrice: isNaN(buyNum) ? 0 : buyNum,
      sellPrice: isNaN(sellNum) ? 0 : sellNum,
      // التوافق: نحتفظ بـ price مساويًا لسعر البيع
      price: isNaN(sellNum) ? 0 : sellNum,
      stock: isNaN(stockNum) ? 0 : stockNum,
    }
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMsg('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        let rows = []
        if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(text)
          rows = Array.isArray(parsed) ? parsed : []
        } else {
          rows = parseCSV(text)
        }
        const products = rows.map(normalizeProduct).filter((p) => p.name)
        let added = 0, updated = 0
        let next = [...items]
        products.forEach((np) => {
          const idx = next.findIndex((p) => (np.sku && p.sku === np.sku) || (!np.sku && p.name === np.name))
          if (idx >= 0) {
            next[idx] = { ...next[idx], ...np }
            updated++
          } else {
            next.unshift({ id: uid(), ...np })
            added++
          }
        })
        setItems(next)
        setImportMsg(`تم استيراد ${added} وإضافة، وتم تحديث ${updated} منتجًا`)
      } catch (err) {
        setImportMsg('فشل الاستيراد: تأكد من صيغة الملف (CSV/JSON)')
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>إدارة المنتجات</div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm">تحميل ملف المنتوجات</button>
            <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleImportFile} />
            <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
              إضافة ملف منتوجات
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                {editing ? 'تعديل منتج' : 'إضافة منتج جديد'}
              </div>
              <ProductForm
                initial={editing || undefined}
                onSubmit={editing ? update : addNew}
                onCancel={() => setEditing(null)}
              />
              {importMsg && <div className="mt-3 text-xs text-gray-600">{importMsg}</div>}
            </div>
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="بحث باسم/رمز/فئة المنتج"
                  className="w-80 rounded-lg border border-gray-200 px-3 py-2"
                />
                <div className="text-xs text-gray-500">عدد النتائج: {filtered.length}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="p-2">الاسم</th>
                      <th className="p-2">SKU</th>
                      <th className="p-2">الفئة</th>
                      <th className="p-2">سعر الشراء</th>
                      <th className="p-2">سعر البيع</th>
                      <th className="p-2">المخزون</th>
                      <th className="p-2">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-t text-gray-800">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.sku}</td>
                        <td className="p-2">{p.category}</td>
                        <td className="p-2">{Number(p.buyPrice ?? 0).toFixed(2)}</td>
                        <td className="p-2">{Number(p.sellPrice ?? p.price ?? 0).toFixed(2)}</td>
                        <td className="p-2">{p.stock}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditing(p)} className="px-3 py-1 rounded-lg border border-gray-200 text-xs">تعديل</button>
                            <button onClick={() => remove(p.id)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs">حذف</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td className="p-3 text-center text-gray-500" colSpan={7}>لا توجد منتجات بعد</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}