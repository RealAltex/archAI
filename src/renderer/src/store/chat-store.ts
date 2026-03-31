import { create } from 'zustand'
import type { ChatMessage } from '../types/chat'
import { nanoid } from 'nanoid'
import { SYSTEM_PROMPT } from '../lib/system-prompt'
import { parseMDSchema } from '../lib/md-schema/parser'
import { useArchitectureStore } from './architecture-store'
import { serializeMDSchema } from '../lib/md-schema/serializer'
import { DEFAULT_LLM_CONFIG, type LLMConfig } from '../types/llm'

interface ChatStore {
     messages: ChatMessage[]
     isStreaming: boolean
     error: string | null
     streamingContent: string
     activeStreamId: string | null
     isAnalyzingFolder: boolean
     streamSanitizerBuffer: string
     streamInsideThinkBlock: boolean

     sendMessage: (content: string) => void
     appendChunk: (streamId: string, chunk: string) => void
     endStream: (streamId: string) => void
     setError: (streamId: string, error: string) => void
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

const CHAT_SNAPSHOT_KEY = 'archai:chat-snapshot:v1'

function loadChatSnapshot(): Partial<Pick<ChatStore, 'messages'>> {
     if (typeof window === 'undefined') return {}

     try {
          const raw = window.localStorage.getItem(CHAT_SNAPSHOT_KEY)
          if (!raw) return {}
          const parsed = JSON.parse(raw) as { messages?: ChatMessage[] }
          return {
               messages: Array.isArray(parsed.messages) ? parsed.messages : []
          }
     } catch {
          return {}
     }
}

function persistChatSnapshot(messages: ChatMessage[]): void {
     if (typeof window === 'undefined') return
     try {
          window.localStorage.setItem(CHAT_SNAPSHOT_KEY, JSON.stringify({ messages }))
     } catch {
          // ignore persistence errors (quota/private mode)
     }
}

const THINK_OPEN_TAG = '<think>'
const THINK_CLOSE_TAG = '</think>'

function extractTrailingTagPrefix(input: string, fullTag: string): string {
     const lastLt = input.lastIndexOf('<')
     if (lastLt === -1) return ''

     const candidate = input.slice(lastLt)
     if (fullTag.startsWith(candidate)) {
          return candidate
     }

     return ''
}

function sanitizeThinkFromChunk(
     chunk: string,
     buffer: string,
     insideThinkBlock: boolean
): { visible: string; nextBuffer: string; nextInsideThinkBlock: boolean } {
     let source = buffer + chunk
     let visible = ''
     let nextBuffer = ''
     let nextInsideThinkBlock = insideThinkBlock

     while (source.length > 0) {
          if (nextInsideThinkBlock) {
               const closeIndex = source.indexOf(THINK_CLOSE_TAG)

               if (closeIndex === -1) {
                    nextBuffer = extractTrailingTagPrefix(source, THINK_CLOSE_TAG)
                    break
               }

               source = source.slice(closeIndex + THINK_CLOSE_TAG.length)
               nextInsideThinkBlock = false
               continue
          }

          const openIndex = source.indexOf(THINK_OPEN_TAG)

          if (openIndex === -1) {
               const trailingPrefix = extractTrailingTagPrefix(source, THINK_OPEN_TAG)
               if (trailingPrefix) {
                    visible += source.slice(0, source.length - trailingPrefix.length)
                    nextBuffer = trailingPrefix
               } else {
                    visible += source
               }
               break
          }

          visible += source.slice(0, openIndex)
          source = source.slice(openIndex + THINK_OPEN_TAG.length)
          nextInsideThinkBlock = true
     }

     return {
          visible: visible.replaceAll(THINK_CLOSE_TAG, ''),
          nextBuffer,
          nextInsideThinkBlock
     }
}

function extractArchaiBlock(text: string): string | null {
     // Try strict archai fence first
     const strictMatch = text.match(/```archai\s*\n([\s\S]*?)```/)
     if (strictMatch) return strictMatch[1]

     // Fallback: open archai fence without closing fence yet
     const archaiStart = text.indexOf('```archai')
     if (archaiStart >= 0) {
          const contentStart = text.indexOf('\n', archaiStart)
          if (contentStart >= 0) {
               const trailing = text.slice(contentStart + 1)
               return trailing.replace(/```\s*$/, '').trim()
          }
     }

     // Fallback: look for a block that contains the schema frontmatter + sections
     const looseMatch = text.match(/```[a-z]*\s*\n(---\s*\n[\s\S]*?#\s+[^\n]+[\s\S]*?)```/)
     if (looseMatch) return looseMatch[1]

     // Last resort: if the entire response looks like schema (no code fence but has frontmatter)
     if (text.includes('---\ntitle:') && text.match(/#\s+[^\n]+/)) {
          const start = text.indexOf('---\ntitle:')
          if (start >= 0) {
               // Find end: either end of string or next non-schema text
               return text.slice(start)
          }
     }

     return null
}

function tryParseArchitecture(content: string) {
     const block = extractArchaiBlock(content)
     if (!block) return null

     const candidates = [
          block,
          block.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim()
     ]

     for (const candidate of candidates) {
          if (!candidate) continue

          try {
               const parsed = parseMDSchema(candidate)
               if (parsed.nodes.length > 0 || parsed.edges.length > 0 || parsed.title !== 'Untitled') {
                    return parsed
               }
          } catch {
               // try next candidate
          }
     }

     return null
}

function normalizeLLMConfig(value: unknown): LLMConfig {
     if (!value || typeof value !== 'object') return DEFAULT_LLM_CONFIG

     const partial = value as Partial<LLMConfig>
     return {
          ...DEFAULT_LLM_CONFIG,
          ...partial,
          notesDensity: partial.notesDensity === 'standard' ? 'standard' : 'dense'
     }
}

function buildDeepPlanningSystemMessage(config: LLMConfig): string {
     const mode = config.deepPlanningMode ? 'ON' : 'OFF'
     const nodeMin = Math.max(1, Math.floor(config.targetNodeCount * 0.67))
     const nodeMax = Math.max(nodeMin, Math.ceil(config.targetNodeCount * 1.33))

     return `Planning profile (must follow):\n- Deep planning mode: ${mode}\n- Target node count: ${config.targetNodeCount} (acceptable range: ${nodeMin}-${nodeMax})\n- Maximum hierarchy depth: ${config.maxHierarchyDepth}\n- Planning passes to simulate internally: ${config.planningPasses}\n- Notes density: ${config.notesDensity}\n- Use root-first top-down decomposition and keep all existing nodes on updates.\n- Prefer structured notes via keys: notes.summary, notes.responsibilities, notes.decisions, notes.risks, notes.nextSteps.`
}

export const useChatStore = create<ChatStore>((set, get) => ({
     messages: loadChatSnapshot().messages || [],
     isStreaming: false,
     error: null,
     streamingContent: '',
     activeStreamId: null,
     isAnalyzingFolder: false,
     streamSanitizerBuffer: '',
     streamInsideThinkBlock: false,

     sendMessage: (content) => {
          if (get().isStreaming) return

          const streamId = nanoid()
          const userMessage: ChatMessage = {
               id: nanoid(),
               role: 'user',
               content,
               timestamp: Date.now()
          }

          set((state) => ({
               messages: [...state.messages, userMessage],
               isStreaming: true,
               activeStreamId: streamId,
               error: null,
               streamingContent: '',
               streamSanitizerBuffer: '',
               streamInsideThinkBlock: false
          }))

          // Get current architecture to include as context
          const archStore = useArchitectureStore.getState()
          const currentArch = archStore.getArchitectureData()
          let contextMessage = ''
          if (currentArch.nodes.length > 0) {
               const md = serializeMDSchema(currentArch)
               contextMessage = `The user's current architecture on the canvas is:\n\`\`\`archai\n${md}\`\`\`\nWhen modifying, include ALL existing nodes plus changes in a single archai block.`
          }

          // Get LLM config from settings
          window.electronAPI.settings.getAll()
               .then((settings) => {
                    const config = normalizeLLMConfig(settings.llmConfig)

                    // Build messages array for LLM
                    const systemMessages = [
                         { role: 'system' as const, content: SYSTEM_PROMPT },
                         { role: 'system' as const, content: buildDeepPlanningSystemMessage(config) },
                         ...(contextMessage ? [{ role: 'system' as const, content: contextMessage }] : [])
                    ]
                    const chatHistory = get().messages.map((m) => ({ role: m.role, content: m.content }))
                    const allMessages = [
                         ...systemMessages,
                         ...chatHistory,
                         { role: 'user' as const, content }
                    ]

                    // API key is injected securely by the main process — never sent from renderer
                    window.electronAPI.llm.startStream(allMessages, config, streamId)
               })
               .catch((err: unknown) => {
                    const message = err instanceof Error ? err.message : 'Failed to start chat stream'
                    get().setError(streamId, message)
               })
     },

     appendChunk: (streamId, chunk) => {
          if (streamId !== get().activeStreamId) return

          const { streamSanitizerBuffer, streamInsideThinkBlock } = get()
          const sanitized = sanitizeThinkFromChunk(chunk, streamSanitizerBuffer, streamInsideThinkBlock)

          set((state) => ({
               streamingContent: state.streamingContent + sanitized.visible,
               streamSanitizerBuffer: sanitized.nextBuffer,
               streamInsideThinkBlock: sanitized.nextInsideThinkBlock
          }))
     },

     endStream: (streamId) => {
          if (streamId !== get().activeStreamId) return

          const content = get().streamingContent

          const assistantMessage: ChatMessage = {
               id: nanoid(),
               role: 'assistant',
               content,
               timestamp: Date.now()
          }

          // Check for archai block and update canvas
          const parsedArchitecture = tryParseArchitecture(content)
          if (parsedArchitecture) {
               useArchitectureStore.getState().setArchitectureData(parsedArchitecture)
          }

          set((state) => ({
               messages: [...state.messages, assistantMessage],
               isStreaming: false,
               activeStreamId: null,
               streamingContent: '',
               streamSanitizerBuffer: '',
               streamInsideThinkBlock: false,
               error: !parsedArchitecture && extractArchaiBlock(content)
                    ? 'AI response contained an invalid architecture schema. Previous stable canvas was kept.'
                    : null
          }))
     },

     setError: (streamId, error) => {
          if (streamId !== get().activeStreamId) return

          set({
               error,
               isStreaming: false,
               activeStreamId: null,
               streamingContent: '',
               streamSanitizerBuffer: '',
               streamInsideThinkBlock: false
          })
     },

     abort: () => {
          const streamId = get().activeStreamId
          if (!streamId) return

          window.electronAPI.llm.abort(streamId)
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
                    activeStreamId: null,
                    streamingContent: '',
                    streamSanitizerBuffer: '',
                    streamInsideThinkBlock: false
               }))
          } else {
               set({
                    isStreaming: false,
                    activeStreamId: null,
                    streamingContent: '',
                    streamSanitizerBuffer: '',
                    streamInsideThinkBlock: false
               })
          }
     },

     clearChat: () => {
          set({
               messages: [],
               isStreaming: false,
               activeStreamId: null,
               error: null,
               streamingContent: '',
               streamSanitizerBuffer: '',
               streamInsideThinkBlock: false
          })
     },

     analyzeProject: (scan) => {
          if (get().isStreaming) return

          const streamId = nanoid()
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
               activeStreamId: streamId,
               error: null,
               streamingContent: '',
               streamSanitizerBuffer: '',
               streamInsideThinkBlock: false,
               isAnalyzingFolder: false
          }))

          // Stream to LLM
          window.electronAPI.settings.getAll()
               .then((settings) => {
                    const config = normalizeLLMConfig(settings.llmConfig)

                    // Build messages for LLM with project analysis context
                    const systemMessages = [
                         { role: 'system' as const, content: SYSTEM_PROMPT },
                         { role: 'system' as const, content: buildDeepPlanningSystemMessage(config) },
                         { role: 'system' as const, content: 'The user has just opened an existing project folder. Analyze the code structure and create an architecture diagram that accurately represents the existing project.' }
                    ]
                    const chatHistory = get().messages.map((m) => ({ role: m.role, content: m.content }))
                    const allMessages = [
                         ...systemMessages,
                         ...chatHistory,
                         { role: 'user' as const, content: projectInfo }
                    ]

                    window.electronAPI.llm.startStream(allMessages, config, streamId)
               })
               .catch((err: unknown) => {
                    const message = err instanceof Error ? err.message : 'Failed to start project analysis stream'
                    get().setError(streamId, message)
               })
     }
}))

useChatStore.subscribe((state) => {
     persistChatSnapshot(state.messages)
})

