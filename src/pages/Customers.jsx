import { useEffect, useMemo, useState } from 'react'
import { loadCustomers, saveCustomers, uid } from '../store/storage'
import CustomerForm from '../components/CustomerForm'

export default function Customers() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => { setItems(loadCustomers()) }, [])
  useEffect(() => { saveCustomers(items) }, [items])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((c) => [c.name, c.phone, c.email, c.address].some((v) => (v || '').toLowerCase().includes(s)))
  }, [items, q])

  const addNew = (data) => { setItems((old) => [{ id: uid(), ...data }, ...old]); setEditing(null) }
  const update = (data) => { setItems((old) => old.map((c) => (c.id === editing.id ? { ...editing, ...data } : c))); setEditing(null) }
  const remove = (id) => setItems((old) => old.filter((c) => c.id !== id))

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">إدارة العملاء</div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">{editing ? 'تعديل عميل' : 'إضافة عميل جديد'}</div>
              <CustomerForm initial={editing || undefined} onSubmit={editing ? update : addNew} onCancel={() => setEditing(null)} />
            </div>
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم/الهاتف/البريد/العنوان" className="w-80 rounded-lg border border-gray-200 px-3 py-2" />
                <div className="text-xs text-gray-500">عدد النتائج: {filtered.length}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="p-2">الاسم</th>
                      <th className="p-2">الهاتف</th>
                      <th className="p-2">البريد</th>
                      <th className="p-2">العنوان</th>
                      <th className="p-2">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-t text-gray-800">
                        <td className="p-2">{c.name}</td>
                        <td className="p-2">{c.phone}</td>
                        <td className="p-2">{c.email}</td>
                        <td className="p-2">{c.address}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditing(c)} className="px-3 py-1 rounded-lg border border-gray-200 text-xs">تعديل</button>
                            <button onClick={() => remove(c.id)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs">حذف</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td className="p-3 text-center text-gray-500" colSpan={5}>لا يوجد عملاء بعد</td>
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