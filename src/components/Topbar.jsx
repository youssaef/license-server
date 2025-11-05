import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { getAccessState } from '../store/storage'

export default function Topbar() {
  const [q, setQ] = useState('')
  const [timerText, setTimerText] = useState('')

  useEffect(() => {
    let alive = true
    const update = async () => {
      const access = await getAccessState()
      if (!alive) return
      if (access.reason === 'trial' && access.trial) {
        const endTs = access.trial.startedAt + access.trial.totalDays * 24 * 60 * 60 * 1000
        const msLeft = Math.max(0, endTs - Date.now())
        const minutes = Math.floor(msLeft / (60 * 1000))
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const months = Math.floor(days / 30)
        const remDays = days - months * 30
        const remHours = hours - days * 24
        setTimerText(`متبقٍ: ${months} شهر ${remDays} يوم ${remHours} ساعة`)
      } else if (access.reason === 'expired') {
        setTimerText('انتهت الفترة التجريبية — الرجاء التفعيل')
      } else {
        setTimerText('')
      }
    }
    update()
    const t = setInterval(update, 60 * 1000) // يحدث كل دقيقة
    return () => { alive = false; clearInterval(t) }
  }, [])
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4">
      {/* تمت إزالة الشعار من الترويسة بناءً على طلبك */}
      {/* البحث السريع في الجهة اليسرى */}
      <div className="flex items-center gap-2 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث سريعاً..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </div>
      {/* المؤقّت في الجهة اليمنى */}
      <div className="flex items-center gap-4">
        {timerText && (
          <div className="text-xs px-2 py-1 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
            {timerText}
          </div>
        )}
      </div>
    </header>
  )
}