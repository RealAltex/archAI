import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { llmService } from '../services/llm-service'

export function registerLLMHandlers(): void {
     ipcMain.on(IPC.LLM_STREAM_START, async (event, messages, config) => {
          const window = BrowserWindow.fromWebContents(event.sender)
          if (!window) return

          try {
               for await (const chunk of llmService.streamChat(messages, config)) {
                    if (window.isDestroyed()) return
                    event.sender.send(IPC.LLM_STREAM_CHUNK, chunk)
               }
               if (!window.isDestroyed()) {
                    event.sender.send(IPC.LLM_STREAM_END)
               }
          } catch (err: unknown) {
               if (window.isDestroyed()) return
               const message = err instanceof Error ? err.message : 'Unknown error'
               if (!message.includes('aborted')) {
                    event.sender.send(IPC.LLM_STREAM_ERROR, message)
               }
          }
     })

     ipcMain.on(IPC.LLM_ABORT, () => {
          llmService.abort()
     })
}
