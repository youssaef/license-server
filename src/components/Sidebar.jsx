import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, Settings, ReceiptText, ShoppingCart, MessageCircle, Link as LinkIcon, Camera, Play, Globe } from 'lucide-react'
import { loadSettings } from '../store/storage'

export default function Sidebar() {
  const [settings, setSettings] = useState({})
  useEffect(() => {
    setSettings(loadSettings())
  }, [])
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
    }`

  return (
    <aside className="h-full w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-4 py-4 border-b">
        <img src="/src/LOGO.png" alt="Logo" className="h-12 w-auto" />
        <div className="text-xs text-gray-500">نظام متكامل وحديث</div>
      </div>
      <nav className="p-3 space-y-1">
        <NavLink to="/" className={linkClass} end>
          <LayoutDashboard size={18} />
          <span>لوحة التحكم</span>
        </NavLink>
        <NavLink to="/products" className={linkClass}>
          <Package size={18} />
          <span>المنتجات</span>
        </NavLink>
        <NavLink to="/sales" className={linkClass}>
          <ShoppingCart size={18} />
          <span>البيع</span>
        </NavLink>
        <NavLink to="/invoices" className={linkClass}>
          <ReceiptText size={18} />
          <span>الفواتير</span>
        </NavLink>
        <NavLink to="/customers" className={linkClass}>
          <Users size={18} />
          <span>العملاء</span>
        </NavLink>
        <NavLink to="/settings" className={linkClass}>
          <Settings size={18} />
          <span>الإعدادات</span>
        </NavLink>
      </nav>
      <div className="mt-auto p-4 border-t">
        {settings && (
          <div className="flex flex-wrap items-center gap-3">
            {settings.whatsapp && (
              <a
                href={settings.whatsapp}
                target="_blank"
                rel="noreferrer"
                title="واتساب"
                className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:opacity-90 transition"
              >
                <MessageCircle size={18} />
              </a>
            )}
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noreferrer"
                title="فيسبوك"
                className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition"
              >
                <LinkIcon size={18} />
              </a>
            )}
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                title="إنستغرام"
                className="w-9 h-9 rounded-full bg-pink-600 text-white flex items-center justify-center hover:opacity-90 transition"
              >
                <Camera size={18} />
              </a>
            )}
            {settings.youtube && (
              <a
                href={settings.youtube}
                target="_blank"
                rel="noreferrer"
                title="يوتيوب"
                className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:opacity-90 transition"
              >
                <Play size={18} />
              </a>
            )}
            {settings.website && (
              <a
                href={settings.website}
                target="_blank"
                rel="noreferrer"
                title="الموقع"
                className="w-9 h-9 rounded-full bg-gray-700 text-white flex items-center justify-center hover:opacity-90 transition"
              >
                <Globe size={18} />
              </a>
            )}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-3">© {new Date().getFullYear()} جميع الحقوق محفوظة</div>
      </div>
    </aside>
  )
}