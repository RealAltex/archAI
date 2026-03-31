import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import {
     saveFileDialog,
     openFileDialog,
     exportMDDialog,
     saveProject,
     loadProject,
     listProjects,
     deleteProject
} from '../services/file-service'
import { getSetting, setSetting, getAllSettings } from '../services/store-service'

export function registerFileHandlers(): void {
     ipcMain.handle(IPC.FILE_SAVE, async (_event, content: string, defaultPath?: string) => {
          return saveFileDialog(content, defaultPath)
     })

     ipcMain.handle(IPC.FILE_OPEN, async () => {
          return openFileDialog()
     })

     ipcMain.handle(IPC.FILE_EXPORT, async (_event, content: string) => {
          return exportMDDialog(content)
     })

     ipcMain.handle(IPC.PROJECT_SAVE, async (_event, id: string, data: unknown) => {
          return saveProject(id, data)
     })

     ipcMain.handle(IPC.PROJECT_LOAD, async (_event, id: string) => {
          return loadProject(id)
     })

     ipcMain.handle(IPC.PROJECT_LIST, async () => {
          return listProjects()
     })

     ipcMain.handle(IPC.PROJECT_DELETE, async (_event, id: string) => {
          return deleteProject(id)
     })
}

export function registerSettingsHandlers(): void {
     ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => {
          return getSetting(key)
     })

     ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: unknown) => {
          setSetting(key, value)
     })

     ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
          return getAllSettings()
     })
}
