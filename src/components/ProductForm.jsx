import { useEffect, useState } from 'react'

export default function ProductForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    buyPrice: '',
    sellPrice: '',
    stock: '',
    category: '',
  })

  useEffect(() => {
    if (initial) {
      const next = { ...initial }
      // الحفاظ على التوافق: إن وجد price ولم يوجد sellPrice، ننسخ القيمة
      if (next.price && !next.sellPrice) next.sellPrice = next.price
      setForm(next)
    }
  }, [initial])

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      // نحتفظ بحقل price للتوافق مع الكود القديم باستخدام سعر البيع
      price: Number(form.sellPrice || form.price || 0),
      buyPrice: Number(form.buyPrice || 0),
      sellPrice: Number(form.sellPrice || form.price || 0),
      stock: Number(form.stock || 0),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-2 compact-form">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">اسم المنتج</label>
          <input name="name" value={form.name} onChange={update} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
        </div>
        <div>
          <label className="text-xs text-gray-600">الباركود/الرمز SKU</label>
          <input name="sku" value={form.sku} onChange={update} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">سعر الشراء</label>
          <input name="buyPrice" value={form.buyPrice} onChange={update} type="number" step="0.01" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-600">المخزون</label>
          <input name="stock" value={form.stock} onChange={update} type="number" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-600">سعر البيع</label>
        <input name="sellPrice" value={form.sellPrice} onChange={update} type="number" step="0.01" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
      </div>
      <div>
        <label className="text-xs text-gray-600">الفئة</label>
        <input name="category" value={form.category} onChange={update} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">حفظ</button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200">إلغاء</button>
        )}
      </div>
    </form>
  )
}