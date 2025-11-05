import { useEffect, useRef, useState } from 'react'
import { loadSettings, saveSettings, exportData, importData, getMachineId, getTrialInfo, loadLicense, activateLicense, clearLicense } from '../store/storage'

export default function Settings() {
  const [settings, setSettings] = useState({ shopName: '', currency: '' })
  const [saved, setSaved] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef(null)
  const [machineId, setMachineId] = useState('unknown')
  const [trial, setTrial] = useState({ remainingDays: 0, totalDays: 0 })
  const [licenseCode, setLicenseCode] = useState('')
  const [licenseMsg, setLicenseMsg] = useState('')

  useEffect(() => {
    setSettings(loadSettings())
    ;(async () => {
      const mid = await getMachineId()
      setMachineId(mid)
      setTrial(getTrialInfo())
      setLicenseCode(loadLicense())
    })()
  }, [])

  const save = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const doExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    a.download = `shop-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const res = importData(text, { mode: 'replace' })
      setImportMsg(res.ok ? `تم الاستيراد بنجاح` : `فشل الاستيراد: ${res.message}`)
      if (res.ok) {
        setSettings(loadSettings())
      }
    } catch (err) {
      setImportMsg('تعذر قراءة الملف')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setImportMsg(''), 2500)
    }
  }

  // تم حذف دعم روابط التواصل من الإعدادات

  return (
    <div className="space-y-4">
      <div className="card">
      <div className="card-header">الإعدادات</div>
      <div className="card-body compact-form text-sm text-gray-700 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">اسم المتجر</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              value={settings.shopName}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
              placeholder="متجري"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">العملة</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              placeholder="دج (دينار جزائري)"
            />
            <div className="text-xs text-gray-500 mt-1">الافتراضي: دج — دينار جزائري</div>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-xs font-semibold text-gray-700 mb-2">طباعة الفواتير</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-600">حجم الورق</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={settings.paperSize || 'a4'}
                onChange={(e) => setSettings({ ...settings, paperSize: e.target.value })}
              >
                <option value="a4">A4</option>
                <option value="a5">A5</option>
                <option value="letter">Letter</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">اتجاه الورق</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={settings.paperOrientation || 'portrait'}
                onChange={(e) => setSettings({ ...settings, paperOrientation: e.target.value })}
              >
                <option value="portrait">عمودي</option>
                <option value="landscape">أفقي</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">هوامش (مم)</label>
              <input
                type="number"
                min={0}
                max={25}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={Number(settings.paperMarginMm ?? 12)}
                onChange={(e) => setSettings({ ...settings, paperMarginMm: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">يُطبق الحجم والاتجاه والهوامش على الطباعة وملفات PDF.</div>
        </div>

        {/* تم إزالة قسم مواقع التواصل */}
        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={save} className="px-4 py-2 rounded-lg bg-primary-600 text-white">حفظ الإعدادات</button>
          {saved && <span className="text-green-600 text-xs">تم الحفظ</span>}
          <span className="mx-2 text-gray-300">|</span>
          <button onClick={doExport} className="px-3 py-2 rounded-lg bg-gray-800 text-white">حفظ نسخة بيانات</button>
          <label className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 cursor-pointer">
            استيراد بيانات
            <input ref={fileRef} type="file" accept="application/json" onChange={onImportFile} className="hidden" />
          </label>
          {importMsg && <span className="text-xs ml-2 text-blue-600">{importMsg}</span>}
        </div>
      </div>
    </div>
      <div className="card">
        <div className="card-header">ترخيص البرنامج</div>
        <div className="card-body compact-form space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600">معرف الجهاز</div>
              <div className="mt-1 p-2 rounded-lg bg-gray-50 border border-gray-200 break-all">{machineId}</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(machineId) }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                >نسخ المعرف</button>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">الحالة</div>
              <div className="mt-1 p-2 rounded-lg bg-gray-50 border border-gray-200">
                {trial.remainingDays > 0 ? (
                  <span>فترة تجريبية متبقية: {trial.remainingDays} / {trial.totalDays} يوم</span>
                ) : (
                  <span className="text-red-600">انتهت الفترة التجريبية — الرجاء التفعيل</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">كود التفعيل</label>
            <input
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value)}
              placeholder="ألصق الكود بالشكل base64.signature"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={async () => {
                  const res = await activateLicense(licenseCode)
                  setLicenseMsg(res.message)
                  setTimeout(() => setLicenseMsg(''), 2500)
                }}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white"
              >تفعيل</button>
              <button
                onClick={() => { clearLicense(); setLicenseMsg('تم إلغاء التفعيل'); setTimeout(() => setLicenseMsg(''), 2000) }}
                className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 border border-gray-200"
              >إلغاء التفعيل</button>
              {licenseMsg && <span className="text-xs text-blue-600">{licenseMsg}</span>}
            </div>
            <div className="text-xs text-gray-500 mt-1">الترخيص مرتبط بهذا الجهاز فقط.</div>
          </div>
        </div>
      </div>
    </div>
  )
}