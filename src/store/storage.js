const KEY_PRODUCTS = 'shop_products'
const KEY_CUSTOMERS = 'shop_customers'
const KEY_SETTINGS = 'shop_settings'
const KEY_INVOICES = 'shop_invoices'

export const DEFAULT_SETTINGS = {
  shopName: '',
  currency: 'دج',
  // إعدادات الطباعة الافتراضية
  paperSize: 'a4', // a4 | a5 | letter
  paperOrientation: 'portrait', // portrait | landscape
  paperMarginMm: 12, // هوامش الصفحة للطباعة
}

export function loadProducts() {
  try {
    const raw = localStorage.getItem(KEY_PRODUCTS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveProducts(items) {
  localStorage.setItem(KEY_PRODUCTS, JSON.stringify(items))
}

export function loadCustomers() {
  try {
    const raw = localStorage.getItem(KEY_CUSTOMERS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCustomers(items) {
  localStorage.setItem(KEY_CUSTOMERS, JSON.stringify(items))
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings))
}

export function loadInvoices() {
  try {
    const raw = localStorage.getItem(KEY_INVOICES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveInvoices(items) {
  localStorage.setItem(KEY_INVOICES, JSON.stringify(items))
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ===== النسخ الاحتياطي والاستيراد =====
export function exportData() {
  return {
    meta: {
      version: 1,
      exportedAt: new Date().toISOString(),
    },
    settings: loadSettings(),
    products: loadProducts(),
    customers: loadCustomers(),
    invoices: loadInvoices(),
  }
}

export function importData(payload, { mode = 'replace' } = {}) {
  try {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload
    if (!data || typeof data !== 'object') {
      return { ok: false, message: 'صيغة بيانات غير صالحة' }
    }

    const safeArray = (v) => (Array.isArray(v) ? v : [])
    const safeObject = (v) => (v && typeof v === 'object' ? { ...DEFAULT_SETTINGS, ...v } : { ...DEFAULT_SETTINGS })

    const settings = safeObject(data.settings)
    const products = safeArray(data.products)
    const customers = safeArray(data.customers)
    const invoices = safeArray(data.invoices)

    if (mode === 'replace') {
      saveSettings(settings)
      saveProducts(products)
      saveCustomers(customers)
      saveInvoices(invoices)
    } else if (mode === 'merge') {
      // دمج بسيط بدون إزالة التعارضات المتقدمة
      const mergedSettings = { ...loadSettings(), ...settings }
      const mergedProducts = mergeUnique(loadProducts(), products)
      const mergedCustomers = mergeUnique(loadCustomers(), customers)
      const mergedInvoices = mergeUnique(loadInvoices(), invoices)

      saveSettings(mergedSettings)
      saveProducts(mergedProducts)
      saveCustomers(mergedCustomers)
      saveInvoices(mergedInvoices)
    } else {
      return { ok: false, message: 'وضع الاستيراد غير معروف' }
    }

    return {
      ok: true,
      message: 'تم الاستيراد بنجاح',
      counts: {
        products: products.length,
        customers: customers.length,
        invoices: invoices.length,
      },
    }
  } catch (e) {
    return { ok: false, message: 'فشل قراءة الملف: ' + (e?.message || 'خطأ غير معروف') }
  }
}

function mergeUnique(current, incoming) {
  const byKey = (item) => item?.id || item?.sku || item?.code || JSON.stringify(item)
  const map = new Map()
  for (const it of Array.isArray(current) ? current : []) {
    map.set(byKey(it), it)
  }
  for (const it of Array.isArray(incoming) ? incoming : []) {
    map.set(byKey(it), it)
  }
  return Array.from(map.values())
}

// ===== الترخيص والفترة التجريبية =====
const KEY_LICENSE = 'shop_license'
const KEY_TRIAL = 'shop_trial'
const TRIAL_DAYS = 7
// ملاحظة: غيّر هذا السر قبل الإصدار العام، ومن الأفضل استبداله بتوقيع بمفتاح خاص/عام.
const LICENSE_SECRET = 'CHANGE_ME_SECRET_2025_11'

function nowTs() {
  return Date.now()
}

function daysBetween(tsStart, tsEnd) {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((tsEnd - tsStart) / msPerDay)
}

function jsonToBase64(obj) {
  const str = JSON.stringify(obj)
  return btoa(unescape(encodeURIComponent(str)))
}

function base64ToJson(b64) {
  try {
    const str = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(str)
  } catch {
    return null
  }
}

async function hmacSHA256(message, secret) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  const bytes = new Uint8Array(sig)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getMachineId() {
  try {
    return window?.licenseAPI?.getMachineId?.() || 'unknown'
  } catch {
    return 'unknown'
  }
}

export function startTrialIfNeeded() {
  try {
    const raw = localStorage.getItem(KEY_TRIAL)
    if (!raw) {
      const trial = { startedAt: nowTs() }
      localStorage.setItem(KEY_TRIAL, JSON.stringify(trial))
    }
  } catch {}
}

export function getTrialInfo() {
  try {
    const raw = localStorage.getItem(KEY_TRIAL)
    const trial = raw ? JSON.parse(raw) : { startedAt: nowTs() }
    const elapsed = daysBetween(trial.startedAt, nowTs())
    const remaining = Math.max(0, TRIAL_DAYS - elapsed)
    return { startedAt: trial.startedAt, elapsedDays: elapsed, remainingDays: remaining, totalDays: TRIAL_DAYS }
  } catch {
    return { startedAt: nowTs(), elapsedDays: 0, remainingDays: TRIAL_DAYS, totalDays: TRIAL_DAYS }
  }
}

export function loadLicense() {
  try {
    const raw = localStorage.getItem(KEY_LICENSE)
    return raw || ''
  } catch {
    return ''
  }
}

export async function validateLicenseCode(code, machineId) {
  try {
    if (!code || typeof code !== 'string' || !code.includes('.')) {
      return { ok: false, message: 'صيغة كود غير صحيحة' }
    }
    const [payloadB64, sigHex] = code.split('.')
    const payload = base64ToJson(payloadB64)
    if (!payload || !payload.mid) {
      return { ok: false, message: 'حمولة ترخيص غير صالحة' }
    }
    if (payload.mid !== machineId) {
      return { ok: false, message: 'هذا الكود ليس لهذا الجهاز' }
    }
    const expectedSig = await hmacSHA256(payloadB64, LICENSE_SECRET)
    if (expectedSig !== sigHex) {
      return { ok: false, message: 'كود غير صالح (توقيع خاطئ)' }
    }
    if (payload.exp && Number(payload.exp) < nowTs()) {
      return { ok: false, message: 'انتهت صلاحية الترخيص' }
    }
    return { ok: true, payload }
  } catch (e) {
    return { ok: false, message: 'فشل التحقق من الكود' }
  }
}

export async function activateLicense(code) {
  const mid = await getMachineId()
  const res = await validateLicenseCode(code, mid)
  if (res.ok) {
    try {
      localStorage.setItem(KEY_LICENSE, code)
    } catch {}
    return { ok: true, message: 'تم التفعيل بنجاح' }
  }
  return { ok: false, message: res.message || 'كود غير صالح' }
}

export function clearLicense() {
  try { localStorage.removeItem(KEY_LICENSE) } catch {}
}

export async function getAccessState() {
  startTrialIfNeeded()
  const mid = await getMachineId()
  const code = loadLicense()
  const trial = getTrialInfo()
  if (code) {
    const res = await validateLicenseCode(code, mid)
    if (res.ok) {
      const type = res.payload?.type || 'full'
      const exp = res.payload?.exp || null
      return { allowed: true, reason: 'licensed', machineId: mid, license: { type, exp } }
    }
  }
  if (trial.remainingDays > 0) {
    return { allowed: true, reason: 'trial', machineId: mid, trial }
  }
  return { allowed: false, reason: 'expired', machineId: mid, trial }
}

// مولّد كود ترخيص (للاستخدام من قبل المطوّر خارج التطبيق):
// الصيغة: base64(JSON({ mid, type, exp })) + '.' + HMAC_SHA256(payloadB64, SECRET)
// حيث:
// - mid: معرف الجهاز
// - type: 'full' أو 'time'
// - exp: طابع زمني بالمللي ثانية لانتهاء الترخيص (اختياري في حالة full)