import { create } from 'zustand'
import type { ChatMessage } from '../types/chat'
import { nanoid } from 'nanoid'
import { SYSTEM_PROMPT } from '../lib/system-prompt'
import { parseMDSchema } from '../lib/md-schema/parser'
import { useArchitectureStore } from './architecture-store'
import { serializeMDSchema } from '../lib/md-schema/serializer'

interface ChatStore {
     messages: ChatMessage[]
     isStreaming: boolean
     error: string | null
     streamingContent: string
     isAnalyzingFolder: boolean

     sendMessage: (content: string) => void
     appendChunk: (chunk: string) => void
     endStream: () => void
     setError: (error: string) => void
     abort: () => void
     clearChat: () => void
     analyzeProject: (scan: {
          folderPath: string
          folderName: string
          tree: string
          keyFiles: Array<{ name: string; content: string }>
          fileCount: number
          dirCount: number
     }) => void
}

function extractArchaiBlock(text: string): string | null {
     // Try strict archai fence first
     const strictMatch = text.match(/```archai\s*\n([\s\S]*?)```/)
     if (strictMatch) return strictMatch[1]

     // Fallback: look for a block that contains the schema frontmatter + sections
     const looseMatch = text.match(/```[a-z]*\s*\n(---\s*\n[\s\S]*?#\s+(?:Systems|Containers|Components|Connections)[\s\S]*?)```/)
     if (looseMatch) return looseMatch[1]

     // Last resort: if the entire response looks like schema (no code fence but has frontmatter)
     if (text.includes('---\ntitle:') && text.match(/#\s+(?:Systems|Containers|Components|Connections)/)) {
          const start = text.indexOf('---\ntitle:')
          if (start >= 0) {
               // Find end: either end of string or next non-schema text
               return text.slice(start > 0 ? start - 4 : start)  // include --- before title
          }
     }

     return null
}

export const useChatStore = create<ChatStore>((set, get) => ({
     messages: [],
     isStreaming: false,
     error: null,
     streamingContent: '',
     isAnalyzingFolder: false,

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

          // Get current architecture to include as context
          const archStore = useArchitectureStore.getState()
          const currentArch = archStore.getArchitectureData()
          let contextMessage = ''
          if (currentArch.nodes.length > 0) {
               const md = serializeMDSchema(currentArch)
               contextMessage = `The user's current architecture on the canvas is:\n\`\`\`archai\n${md}\`\`\`\nWhen modifying, include ALL existing nodes plus changes in a single archai block.`
          }

          // Build messages array for LLM
          const systemMessages = [
               { role: 'system', content: SYSTEM_PROMPT },
               ...(contextMessage ? [{ role: 'system', content: contextMessage }] : [])
          ]
          const chatHistory = get().messages.map((m) => ({ role: m.role, content: m.content }))
          const allMessages = [
               ...systemMessages,
               ...chatHistory,
               { role: 'user', content }
          ]

          // Get LLM config from settings
          window.electronAPI.settings.getAll().then((settings) => {
               const config = (settings.llmConfig || {}) as {
                    provider: string; baseURL: string;
                    model: string; temperature: number; maxTokens: number
               }
               // API key is injected securely by the main process — never sent from renderer
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
     },

     analyzeProject: (scan) => {
          set({ isAnalyzingFolder: true })

          // Format project info for LLM
          const projectInfo = `I just opened a project folder "${scan.folderName}" with the following structure:\n\nFolder: ${scan.folderPath}\nFiles: ${scan.fileCount}, Directories: ${scan.dirCount}\n\nDirectory Tree:\n\`\`\`\n${scan.tree}\n\`\`\`\n\nKey Files and Source Code:\n${scan.keyFiles.map((f) => `\n=== ${f.name} ===\n${f.content}`).join('\n')}\n\nPlease analyze this project and create an architecture diagram based on what you see in the code and configuration files.`

          const userMessage: ChatMessage = {
               id: nanoid(),
               role: 'user',
               content: projectInfo,
               timestamp: Date.now()
          }

          set((state) => ({
               messages: [...state.messages, userMessage],
               isStreaming: true,
               error: null,
               streamingContent: '',
               isAnalyzingFolder: false
          }))

          // Build messages for LLM with project analysis context
          const systemMessages = [
               { role: 'system', content: SYSTEM_PROMPT },
               { role: 'system', content: 'The user has just opened an existing project folder. Analyze the code structure and create an architecture diagram that accurately represents the existing project.' }
          ]
          const chatHistory = get().messages.map((m) => ({ role: m.role, content: m.content }))
          const allMessages = [
               ...systemMessages,
               ...chatHistory,
               { role: 'user', content: projectInfo }
          ]

          // Stream to LLM
          window.electronAPI.settings.getAll().then((settings) => {
               const config = (settings.llmConfig || {}) as {
                    provider: string; baseURL: string;
                    model: string; temperature: number; maxTokens: number
               }
               window.electronAPI.llm.startStream(allMessages, config)
          })
     }
}))

