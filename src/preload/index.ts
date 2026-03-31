import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'

contextBridge.exposeInMainWorld('electronAPI', {
     llm: {
          startStream: (messages, config, streamId) => {
               // Strip apiKey if accidentally included — main process handles it securely
               const { apiKey: _stripped, ...safeConfig } = config
               ipcRenderer.send(IPC.LLM_STREAM_START, {
                    messages,
                    config: safeConfig,
                    streamId
               })
          },
          onChunk: (callback: (streamId: string, chunk: string) => void) => {
               const handler = (_event: Electron.IpcRendererEvent, payload: { streamId: string; chunk: string }) => {
                    callback(payload.streamId, payload.chunk)
               }
               ipcRenderer.on(IPC.LLM_STREAM_CHUNK, handler)
               return () => ipcRenderer.removeListener(IPC.LLM_STREAM_CHUNK, handler)
          },
          onEnd: (callback: (streamId: string) => void) => {
               const handler = (_event: Electron.IpcRendererEvent, payload: { streamId: string }) => callback(payload.streamId)
               ipcRenderer.on(IPC.LLM_STREAM_END, handler)
               return () => ipcRenderer.removeListener(IPC.LLM_STREAM_END, handler)
          },
          onError: (callback: (streamId: string, error: string) => void) => {
               const handler = (_event: Electron.IpcRendererEvent, payload: { streamId: string; error: string }) => {
                    callback(payload.streamId, payload.error)
               }
               ipcRenderer.on(IPC.LLM_STREAM_ERROR, handler)
               return () => ipcRenderer.removeListener(IPC.LLM_STREAM_ERROR, handler)
          },
          abort: (streamId?: string) => {
               ipcRenderer.send(IPC.LLM_ABORT, { streamId })
          }
     },
     settings: {
          get: (key: string) => ipcRenderer.invoke(IPC.SETTINGS_GET, key),
          set: (key: string, value: unknown) => ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
          getAll: () => ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),
          setApiKey: (apiKey: string) => ipcRenderer.invoke(IPC.SETTINGS_SET_API_KEY, apiKey),
          hasApiKey: () => ipcRenderer.invoke(IPC.SETTINGS_HAS_API_KEY)
     },
     files: {
          save: (content: string, defaultPath?: string) =>
               ipcRenderer.invoke(IPC.FILE_SAVE, content, defaultPath),
          open: () => ipcRenderer.invoke(IPC.FILE_OPEN),
          exportMD: (content: string) => ipcRenderer.invoke(IPC.FILE_EXPORT, content),
          scanFolder: () => ipcRenderer.invoke(IPC.FOLDER_SCAN)
     },
     projects: {
          save: (id: string, data: unknown) => ipcRenderer.invoke(IPC.PROJECT_SAVE, id, data),
          load: (id: string) => ipcRenderer.invoke(IPC.PROJECT_LOAD, id),
          list: () => ipcRenderer.invoke(IPC.PROJECT_LIST),
          delete: (id: string) => ipcRenderer.invoke(IPC.PROJECT_DELETE, id)
     }
})
