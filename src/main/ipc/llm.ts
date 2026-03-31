import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { llmService } from '../services/llm-service'
import { getApiKey } from '../services/store-service'

interface StreamStartPayload {
     streamId: string
     messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
     config: {
          provider: string
          baseURL: string
          model: string
          temperature: number
          maxTokens: number
     }
}

const activeStreams = new Map<number, { streamId: string; abortController: AbortController }>()

export function registerLLMHandlers(): void {
     ipcMain.on(IPC.LLM_STREAM_START, async (event, payload: StreamStartPayload) => {
          const window = BrowserWindow.fromWebContents(event.sender)
          if (!window) return

          const senderId = event.sender.id
          const previous = activeStreams.get(senderId)
          if (previous) {
               previous.abortController.abort()
          }

          const abortController = new AbortController()
          activeStreams.set(senderId, { streamId: payload.streamId, abortController })

          // Inject API key from secure storage — never trust the renderer
          const secureConfig = {
               ...payload.config,
               apiKey: getApiKey()
          }

          try {
               for await (const chunk of llmService.streamChat(payload.messages, secureConfig, abortController.signal)) {
                    if (window.isDestroyed()) return

                    const active = activeStreams.get(senderId)
                    if (!active || active.streamId !== payload.streamId) {
                         return
                    }

                    event.sender.send(IPC.LLM_STREAM_CHUNK, { streamId: payload.streamId, chunk })
               }

               if (!window.isDestroyed()) {
                    const active = activeStreams.get(senderId)
                    if (active && active.streamId === payload.streamId) {
                         event.sender.send(IPC.LLM_STREAM_END, { streamId: payload.streamId })
                    }
               }
          } catch (err: unknown) {
               if (window.isDestroyed()) return

               const message = err instanceof Error ? err.message : 'Unknown error'
               const isAbortError = message.toLowerCase().includes('aborted')

               if (isAbortError) {
                    return
               }

               if (!message.includes('aborted')) {
                    const active = activeStreams.get(senderId)
                    if (active && active.streamId === payload.streamId) {
                         event.sender.send(IPC.LLM_STREAM_ERROR, { streamId: payload.streamId, error: message })
                    }
               }
          } finally {
               const active = activeStreams.get(senderId)
               if (active && active.streamId === payload.streamId) {
                    activeStreams.delete(senderId)
               }
          }
     })

     ipcMain.on(IPC.LLM_ABORT, (event, payload?: { streamId?: string }) => {
          const active = activeStreams.get(event.sender.id)
          if (!active) return

          if (payload?.streamId && payload.streamId !== active.streamId) {
               return
          }

          active.abortController.abort()
          activeStreams.delete(event.sender.id)
     })
}
