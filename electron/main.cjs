const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('node:path')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
  })

  const startUrl = process.env.ELECTRON_START_URL
    || new URL('file://' + path.join(__dirname, '../dist/index.html')).toString()

  mainWindow.loadURL(startUrl)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // فتح الروابط الخارجية في المتصفح الافتراضي
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.setAppUserModelId('ShopManager')

app.whenReady().then(() => {
  // إزالة قائمة التطبيق الافتراضية (File, Edit, View, ...)
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})