const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 900,
    minWidth: 375,
    minHeight: 667,
    title: 'Entrega Livre',
    icon: path.join(__dirname, '../public/logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Visual mobile-like no desktop
    resizable: true,
    center: true,
  })

  // Carrega o build do Vite (VITE_PLATFORM=electron usa base './')
  const indexPath = path.join(__dirname, '../dist/index.html')
  win.loadFile(indexPath)

  // Abre links externos no browser padrão
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
