import { create } from 'zustand'
import type { ChatMessage } from '../types/chat'
import { nanoid } from 'nanoid'
import { SYSTEM_PROMPT } from '../lib/system-prompt'
import { parseMDSchema } from '../lib/md-schema/parser'
import { useArchitectureStore } from './architecture-store'

interface ChatStore {
     messages: ChatMessage[]
     isStreaming: boolean
     error: string | null
     streamingContent: string

     sendMessage: (content: string) => void
     appendChunk: (chunk: string) => void
     endStream: () => void
     setError: (error: string) => void
     abort: () => void
     clearChat: () => void
}

function extractArchaiBlock(text: string): string | null {
     const match = text.match(/```archai\n([\s\S]*?)```/)
     return match ? match[1] : null
}

export const useChatStore = create<ChatStore>((set, get) => ({
     messages: [],
     isStreaming: false,
     error: null,
     streamingContent: '',

     sendMessage: (content) => {
          const userMessage: ChatMessage = {
               id: nanoid(),
               role: 'user',
               content,
               timestamp: Date.now()
          }

          set((state) => ({
               messages: [...state.messages, userMessage],
               isStreaming: true,
               error: null,
               streamingContent: ''
          }))

          // Build messages array for LLM
          const allMessages = [
               { role: 'system', content: SYSTEM_PROMPT },
               ...get().messages.map((m) => ({ role: m.role, content: m.content })),
               { role: 'user', content }
          ]

          // Get LLM config from settings
          window.electronAPI.settings.getAll().then((settings) => {
               const config = (settings.llmConfig || {}) as {
                    provider: string; apiKey: string; baseURL: string;
                    model: string; temperature: number; maxTokens: number
               }
               window.electronAPI.llm.startStream(allMessages, config)
          })
     },

     appendChunk: (chunk) => {
          set((state) => ({
               streamingContent: state.streamingContent + chunk
          }))
     },

     endStream: () => {
          const content = get().streamingContent

          const assistantMessage: ChatMessage = {
               id: nanoid(),
               role: 'assistant',
               content,
               timestamp: Date.now()
          }

          // Check for archai block and update canvas
          const archaiBlock = extractArchaiBlock(content)
          if (archaiBlock) {
               try {
                    const archData = parseMDSchema(archaiBlock)
                    useArchitectureStore.getState().setArchitectureData(archData)
               } catch (e) {
                    console.error('Failed to parse archai block:', e)
               }
          }

          set((state) => ({
               messages: [...state.messages, assistantMessage],
               isStreaming: false,
               streamingContent: ''
          }))
     },

     setError: (error) => {
          set({ error, isStreaming: false, streamingContent: '' })
     },

     abort: () => {
          window.electronAPI.llm.abort()
          const content = get().streamingContent
          if (content) {
               const assistantMessage: ChatMessage = {
                    id: nanoid(),
                    role: 'assistant',
                    content: content + '\n\n*(aborted)*',
                    timestamp: Date.now()
               }
               set((state) => ({
                    messages: [...state.messages, assistantMessage],
                    isStreaming: false,
                    streamingContent: ''
               }))
          } else {
               set({ isStreaming: false, streamingContent: '' })
          }
     },

     clearChat: () => {
          set({ messages: [], isStreaming: false, error: null, streamingContent: '' })
     }
}))
