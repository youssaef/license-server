import { useEffect, useState } from 'react'

export default function CustomerForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: ''
  })

  useEffect(() => { if (initial) setForm({ ...initial }) }, [initial])

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const submit = (e) => { e.preventDefault(); onSubmit(form) }

  return (
    <form onSubmit={submit} className="space-y-2 compact-form">
      <div>
        <label className="text-xs text-gray-600">الاسم</label>
        <input name="name" value={form.name} onChange={update} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">الهاتف</label>
          <input name="phone" value={form.phone} onChange={update} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-600">البريد الإلكتروني</label>
          <input name="email" value={form.email} onChange={update} type="email" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-600">العنوان</label>
        <input name="address" value={form.address} onChange={update} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white">حفظ</button>
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200">إلغاء</button>}
      </div>
    </form>
  )
}