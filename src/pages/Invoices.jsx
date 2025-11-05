import { useEffect, useState } from 'react'
import { loadInvoices, loadSettings, saveInvoices } from '../store/storage'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Invoices() {
  const settings = loadSettings()
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [note, setNote] = useState('')
  const [paying, setPaying] = useState(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payNote, setPayNote] = useState('')
  const [payDate, setPayDate] = useState('')

  useEffect(() => { setItems(loadInvoices()) }, [])

  const formatDate = (iso) => new Date(iso).toLocaleString('ar-DZ')
  const lastPaymentDate = (inv) => {
    const arr = inv?.payments || []
    if (!arr.length) return null
    const last = arr[arr.length - 1]
    return last?.date || null
  }

  const printInvoice = (inv) => {
    const total = inv.total.toFixed(2) + ' ' + settings.currency
    const sizeMap = { a4: 'A4', a5: 'A5', letter: 'Letter' }
    const pageSize = sizeMap[String(settings.paperSize || 'a4').toLowerCase()] || 'A4'
    const orientation = (settings.paperOrientation || 'portrait').toLowerCase() === 'landscape' ? 'landscape' : 'portrait'
    const marginMm = Number(settings.paperMarginMm ?? 12)

    const html = `
      <html dir="rtl" lang="ar"><head><title>فاتورة ${inv.id}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700&display=swap" rel="stylesheet">
      <style>
        @page { size: ${pageSize} ${orientation}; margin: ${marginMm}mm; }
        @media print { html, body { height: 100%; } }
        body { font-family:'Almarai',system-ui; color:#111827; }
        .wrap { max-width: 940px; margin: 0 auto; }
        .hdr { margin-bottom: 12px; display:flex; align-items:center; justify-content:space-between; }
        .brand { display:flex; align-items:center; gap:8px; }
        .title { font-weight:700; font-size: 18px; }
        table { width:100%; border-collapse:collapse; }
        thead th { background:#f9fafb; color:#6b7280; font-weight:600; }
        th, td { border:1px solid #e5e7eb; padding:8px; }
        tbody tr:nth-child(even) { background:#fcfcfd; }
        .section { margin-top: 10px; }
        .summary { margin-top: 8px; font-weight:600; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 10px 0; }
      </style>
      </head><body>
        <div class="wrap">
        <div class="hdr">
          <div>
            <span class="title">فاتورة</span> #${inv.id} — ${formatDate(inv.date)}<br/>
            الزبون: ${inv.customer ? inv.customer.name : 'نقدي'}${inv.customer && inv.customer.phone ? ' — الهاتف: ' + inv.customer.phone : ''}<br/>
            الحالة: ${inv.status === 'debt' ? 'دين' : 'مسدد'}<br/>
            المدفوع: ${(Number(inv.paidAmount||0)).toFixed(2)} ${settings.currency}${(inv.payments && inv.payments.length > 0) ? ' — آخر دفع: ' + new Date(inv.payments[inv.payments.length-1].date).toLocaleString('ar-DZ') : ''}
          </div>
          <div class="brand"><img src="/src/LOGO.png" alt="Logo" style="height:40px"/></div>
        </div>
        <table><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>
        ${inv.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toFixed(2)} ${settings.currency}</td><td>${(i.price*i.qty).toFixed(2)} ${settings.currency}</td></tr>`).join('')}
        </tbody></table>
        <div class="section">
        <hr/>
        <h4>الدفعات</h4>
        ${(inv.payments && inv.payments.length > 0) ? `
          <table><thead><tr><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>
          ${inv.payments.map(p => `<tr><td>${new Date(p.date).toLocaleString('ar-DZ')}</td><td>${Number(p.amount).toFixed(2)} ${settings.currency}</td><td>${p.note || '-'}</td></tr>`).join('')}
          </tbody></table>
        ` : '<div>لا توجد دفعات مسجلة</div>'}
        </div>
        <div class="section summary">الإجمالي: ${total} — المدفوع: ${(Number(inv.paidAmount||0)).toFixed(2)} ${settings.currency} — المتبقي: ${(Math.max(0, Number(inv.total||0)-Number(inv.paidAmount||0))).toFixed(2)} ${settings.currency}</div>
        <div class="section">
          <hr/>
          <h4>ميزان المراجعة</h4>
          <table><thead><tr><th>مدين</th><th>دائن</th></tr></thead><tbody>
            <tr><td>حساب الزبون: ${Number(inv.total).toFixed(2)} ${settings.currency}</td><td>مدفوع: ${(Number(inv.paidAmount||0)).toFixed(2)} ${settings.currency}</td></tr>
            <tr><td></td><td>متبقي: ${(Math.max(0, Number(inv.total||0)-Number(inv.paidAmount||0))).toFixed(2)} ${settings.currency}</td></tr>
            <tr><td><strong>إجمالي المدين: ${Number(inv.total).toFixed(2)} ${settings.currency}</strong></td><td><strong>إجمالي الدائن: ${(Number(inv.paidAmount||0)+Math.max(0, Number(inv.total||0)-Number(inv.paidAmount||0))).toFixed(2)} ${settings.currency}</strong></td></tr>
          </tbody></table>
        </div>
        </div>
      </body></html>
    `

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.setAttribute('sandbox', 'allow-modals allow-same-origin')
    iframe.srcdoc = html
    document.body.appendChild(iframe)

    const doPrint = async () => {
      const w = iframe.contentWindow
      if (!w) return
      try { if (w.document?.fonts?.ready) await w.document.fonts.ready } catch {}
      const cleanup = () => { try { document.body.removeChild(iframe) } catch {} }
      w.addEventListener('afterprint', cleanup)
      w.focus()
      w.print()
      // احتياط: تنظيف بعد ثانية إن لم يُستدع afterprint
      setTimeout(cleanup, 1500)
    }
    iframe.onload = () => doPrint()
  }

  const exportPDF = async (inv) => {
    // نبني HTML الفاتورة ونستخدم html2canvas لتصويرها كصورة، للحفاظ على العربية.
    const container = document.createElement('div')
    container.setAttribute('dir', 'rtl')
    container.setAttribute('lang', 'ar')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    // نحدد عرض الحاوية وفق حجم الورق والاتجاه
    const pxPerMm = 3.78
    const paper = String(settings.paperSize || 'a4').toLowerCase()
    const orient = String(settings.paperOrientation || 'portrait').toLowerCase()
    const mm = (w, h) => orient === 'landscape' ? h : w
    const widthPx = (
      paper === 'a5' ? mm(148 * pxPerMm, 210 * pxPerMm) :
      paper === 'letter' ? mm(215.9 * pxPerMm, 279.4 * pxPerMm) :
      mm(210 * pxPerMm, 297 * pxPerMm) // افتراضي A4
    )
    container.style.width = `${Math.round(widthPx)}px`
    container.style.background = '#fff'
    container.style.padding = '16px'
    container.style.fontFamily = "'Almarai', system-ui, Arial, 'Segoe UI', Tahoma, sans-serif"

    const total = inv.total.toFixed(2) + ' ' + settings.currency
    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <div>
          <strong>فاتورة</strong> #${inv.id} — ${formatDate(inv.date)}<br/>
          الزبون: ${inv.customer ? inv.customer.name : 'نقدي'}${inv.customer && inv.customer.phone ? ' — الهاتف: ' + inv.customer.phone : ''}<br/>
          الحالة: ${inv.status === 'debt' ? 'دين' : 'مسدد'}<br/>
          المدفوع: ${(Number(inv.paidAmount||0)).toFixed(2)} ${settings.currency}${(inv.payments && inv.payments.length > 0) ? ' — آخر دفع: ' + new Date(inv.payments[inv.payments.length-1].date).toLocaleString('ar-DZ') : ''}
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="/src/LOGO.png" alt="Logo" style="height:40px"/>
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:8px;">الصنف</th>
            <th style="border:1px solid #ddd; padding:8px;">الكمية</th>
            <th style="border:1px solid #ddd; padding:8px;">السعر</th>
            <th style="border:1px solid #ddd; padding:8px;">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items.map(i => `
            <tr>
              <td style="border:1px solid #ddd; padding:8px;">${i.name}</td>
              <td style="border:1px solid #ddd; padding:8px;">${i.qty}</td>
              <td style="border:1px solid #ddd; padding:8px;">${i.price.toFixed(2)} ${settings.currency}</td>
              <td style="border:1px solid #ddd; padding:8px;">${(i.price*i.qty).toFixed(2)} ${settings.currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <hr/>
      <h4>الدفعات</h4>
      ${(inv.payments && inv.payments.length > 0) ? `
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd; padding:8px;">التاريخ</th>
              <th style="border:1px solid #ddd; padding:8px;">المبلغ</th>
              <th style="border:1px solid #ddd; padding:8px;">ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            ${inv.payments.map(p => `
              <tr>
                <td style="border:1px solid #ddd; padding:8px;">${new Date(p.date).toLocaleString('ar-DZ')}</td>
                <td style="border:1px solid #ddd; padding:8px;">${Number(p.amount).toFixed(2)} ${settings.currency}</td>
                <td style="border:1px solid #ddd; padding:8px;">${p.note || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<div>لا توجد دفعات مسجلة</div>'}
      <div style="margin-top:8px">الإجمالي: ${total} — المدفوع: ${(Number(inv.paidAmount||0)).toFixed(2)} ${settings.currency} — المتبقي: ${(Math.max(0, Number(inv.total||0)-Number(inv.paidAmount||0))).toFixed(2)} ${settings.currency}</div>
      <hr/>
      <h4>ميزان المراجعة</h4>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:8px;">مدين</th>
            <th style="border:1px solid #ddd; padding:8px;">دائن</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #ddd; padding:8px;">حساب الزبون: ${Number(inv.total).toFixed(2)} ${settings.currency}</td>
            <td style="border:1px solid #ddd; padding:8px;">مدفوع: ${(Number(inv.paidAmount||0)).toFixed(2)} ${settings.currency}</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd; padding:8px;"></td>
            <td style="border:1px solid #ddd; padding:8px;">متبقي: ${(Math.max(0, Number(inv.total||0)-Number(inv.paidAmount||0))).toFixed(2)} ${settings.currency}</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd; padding:8px;"><strong>إجمالي المدين: ${Number(inv.total).toFixed(2)} ${settings.currency}</strong></td>
            <td style="border:1px solid #ddd; padding:8px;"><strong>إجمالي الدائن: ${(Number(inv.paidAmount||0)+Math.max(0, Number(inv.total||0)-Number(inv.paidAmount||0))).toFixed(2)} ${settings.currency}</strong></td>
          </tr>
        </tbody>
      </table>
    `

    document.body.appendChild(container)
    try {
      // نستخدم scale أعلى للحصول على دقة جيدة عند الطباعة
      const canvas = await html2canvas(container, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ orientation: orient === 'landscape' ? 'landscape' : 'portrait', unit: 'pt', format: paper === 'a5' ? 'a5' : (paper === 'letter' ? 'letter' : 'a4') })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
      const imgWidth = canvas.width * ratio
      const imgHeight = canvas.height * ratio
      const x = (pageWidth - imgWidth) / 2

      pdf.addImage(imgData, 'PNG', x, 0, imgWidth, imgHeight)
      pdf.save(`Invoice-${inv.id}.pdf`)
    } finally {
      document.body.removeChild(container)
    }
  }

  const startEdit = (inv) => {
    setEditing(JSON.parse(JSON.stringify(inv)))
    setNote(inv.note || '')
  }

  const remaining = (inv) => {
    const paid = Number(inv.paidAmount || 0)
    const total = Number(inv.total || 0)
    return Math.max(0, total - paid)
  }

  const startPay = (inv) => {
    setPaying(inv)
    setPayAmount(remaining(inv))
    setPayNote('')
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setPayDate(`${yyyy}-${mm}-${dd}`)
  }

  const applyPayment = () => {
    if (!paying) return
    const rem = remaining(paying)
    const amt = Number(payAmount || 0)
    if (amt <= 0) { alert('أدخل قيمة دفع أكبر من صفر'); return }
    if (amt > rem) { alert('قيمة الدفع تتجاوز المبلغ المتبقي'); return }
    const newPaid = Number(paying.paidAmount || 0) + amt
    const newStatus = newPaid >= Number(paying.total || 0) ? 'paid' : 'debt'
    const dateIso = payDate ? new Date(`${payDate}T00:00:00`).toISOString() : new Date().toISOString()
    const updated = {
      ...paying,
      paidAmount: newPaid,
      status: newStatus,
      payments: [...(paying.payments || []), { amount: amt, date: dateIso, note: payNote }],
    }
    const next = items.map((i) => (i.id === paying.id ? updated : i))
    saveInvoices(next)
    setItems(next)
    setPaying(null)
    setPayAmount(0)
    setPayNote('')
    setPayDate('')
  }

  const applyEdit = () => {
    if (!editing) return
    const total = editing.items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const updated = { ...editing, total, editedAt: new Date().toISOString(), note }
    const next = items.map((i) => (i.id === editing.id ? updated : i))
    saveInvoices(next)
    setItems(next)
    setEditing(null)
  }

  const removeItem = (id) => {
    setEditing((e) => ({ ...e, items: e.items.filter((i) => i.id !== id) }))
  }

  const setQty = (id, qty) => {
    setEditing((e) => ({ ...e, items: e.items.map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i)) }))
  }

  const removeInvoice = (id) => {
    if (!confirm('هل تريد حذف هذه الفاتورة؟ لن يمكن استرجاعها.')) return
    const next = items.filter((i) => i.id !== id)
    saveInvoices(next)
    setItems(next)
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">الفواتير</div>
        <div className="card-body">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="p-2">رقم</th>
                <th className="p-2">التاريخ</th>
                <th className="p-2">الزبون</th>
                <th className="p-2">الحالة</th>
                <th className="p-2">الإجمالي</th>
                <th className="p-2">المتبقّي</th>
                <th className="p-2">آخر دفع</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-t text-gray-800">
                  <td className="p-2">{inv.id}</td>
                  <td className="p-2">{formatDate(inv.date)}</td>
                  <td className="p-2">{inv.customer ? inv.customer.name : 'نقدي'}</td>
                  <td className="p-2">
                    {inv.status === 'debt' ? (
                      <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs">دين</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">مسدد</span>
                    )}
                  </td>
                  <td className="p-2">{inv.total.toFixed(2)} {settings.currency}</td>
                  <td className="p-2">{remaining(inv).toFixed(2)} {settings.currency}</td>
                  <td className="p-2">{lastPaymentDate(inv) ? formatDate(lastPaymentDate(inv)) : '-'}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => printInvoice(inv)} className="px-3 py-1 rounded-lg border text-xs">طباعة</button>
                      <button onClick={() => exportPDF(inv)} className="px-3 py-1 rounded-lg border text-xs">PDF</button>
                      <button onClick={() => startEdit(inv)} className="px-3 py-1 rounded-lg border text-xs">تعديل</button>
                      {remaining(inv) > 0 && (
                        <button onClick={() => startPay(inv)} className="px-3 py-1 rounded-lg bg-primary-600 text-white text-xs">تسديد</button>
                      )}
                      <button onClick={() => removeInvoice(inv.id)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="p-3 text-center text-gray-500" colSpan={8}>لا توجد فواتير بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {editing && (
        <div className="card">
          <div className="card-header">تعديل الفاتورة #{editing.id}</div>
          <div className="card-body space-y-3">
            <div className="text-sm text-gray-600">استخدم التعديل لتقييد إرجاع سلعة من الزبون عبر تقليل الكمية أو حذف الصنف.</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="p-2">الصنف</th>
                    <th className="p-2">الكمية</th>
                    <th className="p-2">السعر</th>
                    <th className="p-2">المجموع</th>
                    <th className="p-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {editing.items.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="p-2">{i.name}</td>
                      <td className="p-2">
                        <input type="number" min={0} value={i.qty} onChange={(e) => setQty(i.id, Number(e.target.value))} className="w-20 rounded-lg border px-2 py-1" />
                      </td>
                      <td className="p-2">{i.price.toFixed(2)} {settings.currency}</td>
                      <td className="p-2">{(i.price * i.qty).toFixed(2)} {settings.currency}</td>
                      <td className="p-2"><button onClick={() => removeItem(i.id)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs">حذف</button></td>
                    </tr>
                  ))}
                  {editing.items.length === 0 && (
                    <tr><td className="p-3 text-center text-gray-500" colSpan={5}>لا توجد أصناف</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div>
              <label className="text-xs text-gray-600">ملاحظة الإرجاع/التعديل</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="سبب الإرجاع أو تفاصيل التعديل" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={applyEdit} className="px-4 py-2 rounded-lg bg-primary-600 text-white">حفظ التعديلات</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {paying && (
        <div className="card">
          <div className="card-header">تسديد فاتورة #{paying.id}</div>
          <div className="card-body space-y-3">
            <div className="text-sm text-gray-600">المتبقّي: {remaining(paying).toFixed(2)} {settings.currency}</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm mt-2">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="p-2">ميزان المراجعة — مدين</th>
                    <th className="p-2">ميزان المراجعة — دائن</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-2">حساب الزبون: {Number(paying.total).toFixed(2)} {settings.currency}</td>
                    <td className="p-2">مدفوع: {Number(paying.paidAmount || 0).toFixed(2)} {settings.currency}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 font-medium">إجمالي المدين: {Number(paying.total).toFixed(2)} {settings.currency}</td>
                    <td className="p-2">متبقي: {remaining(paying).toFixed(2)} {settings.currency}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2"></td>
                    <td className="p-2 font-medium">إجمالي الدائن: {(Number(paying.paidAmount||0)+remaining(paying)).toFixed(2)} {settings.currency}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600">قيمة الدفع</label>
                <input type="number" min={0} max={remaining(paying)} value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-gray-600">تاريخ الدفع</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">ملاحظة</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="مثال: دفعة أولى، تحويل بنكي، إلخ" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={applyPayment} className="px-4 py-2 rounded-lg bg-primary-600 text-white">تأكيد التسديد</button>
              <button onClick={() => setPaying(null)} className="px-4 py-2 rounded-lg border">إلغاء</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm mt-3">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="p-2">تاريخ الدفع</th>
                    <th className="p-2">المبلغ</th>
                    <th className="p-2">ملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {(paying.payments || []).map((p, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{formatDate(p.date)}</td>
                      <td className="p-2">{Number(p.amount).toFixed(2)} {settings.currency}</td>
                      <td className="p-2">{p.note || '-'}</td>
                    </tr>
                  ))}
                  {(paying.payments || []).length === 0 && (
                    <tr><td className="p-3 text-center text-gray-500" colSpan={3}>لا توجد دفعات مسجلة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}