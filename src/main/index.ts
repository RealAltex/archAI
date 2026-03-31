import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { registerLLMHandlers } from './ipc/llm'
import { registerFileHandlers, registerSettingsHandlers } from './ipc/files'
import { initSecureStorage } from './services/store-service'

const isDev = !!process.env['ELECTRON_RENDERER_URL']

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
               sandbox: true,
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

     // --- Security: Block all navigation away from the app ---
     mainWindow.webContents.on('will-navigate', (event, url) => {
          const appURL = isDev
               ? process.env['ELECTRON_RENDERER_URL']!
               : `file://${join(__dirname, '../renderer/index.html')}`
          if (!url.startsWith(appURL)) {
               event.preventDefault()
          }
     })

     // --- Security: Disable DevTools in production ---
     if (!isDev) {
          mainWindow.webContents.on('devtools-opened', () => {
               mainWindow.webContents.closeDevTools()
          })
     }

     // HMR for renderer in development
     if (isDev) {
          mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']!)
     } else {
          mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
     }
}

app.whenReady().then(() => {
     // --- Security: Initialize encrypted storage after app is ready ---
     initSecureStorage()

     // --- Security: Deny all permission requests (camera, mic, geolocation, etc.) ---
     session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
          callback(false)
     })

     session.defaultSession.setPermissionCheckHandler(() => {
          return false
     })

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
