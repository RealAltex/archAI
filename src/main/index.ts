import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { registerLLMHandlers } from './ipc/llm'
import { registerFileHandlers, registerSettingsHandlers } from './ipc/files'

function createWindow(): void {
     const mainWindow = new BrowserWindow({
          width: 1400,
          height: 900,
          minWidth: 900,
          minHeight: 600,
          show: false,
          title: 'archAI',
          webPreferences: {
               preload: join(__dirname, '../preload/index.js'),
               sandbox: false,
               contextIsolation: true,
               nodeIntegration: false
          }
     })

     mainWindow.on('ready-to-show', () => {
          mainWindow.show()
     })

     mainWindow.webContents.setWindowOpenHandler((details) => {
          shell.openExternal(details.url)
          return { action: 'deny' }
     })

     // HMR for renderer in development
     if (process.env['ELECTRON_RENDERER_URL']) {
          mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
     } else {
          mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
     }
}

app.whenReady().then(() => {
     registerLLMHandlers()
     registerFileHandlers()
     registerSettingsHandlers()

     createWindow()

     app.on('activate', () => {
          if (BrowserWindow.getAllWindows().length === 0) createWindow()
     })
})

app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') {
          app.quit()
     }
})
