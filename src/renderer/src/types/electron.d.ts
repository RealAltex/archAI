export interface IElectronAPI {
     llm: {
          startStream: (messages: Array<{ role: string; content: string }>, config: {
               provider: string
               baseURL: string
               model: string
               temperature: number
               maxTokens: number
               deepPlanningMode?: boolean
               targetNodeCount?: number
               maxHierarchyDepth?: number
               planningPasses?: number
               notesDensity?: 'standard' | 'dense'
          }, streamId: string) => void
          onChunk: (callback: (streamId: string, chunk: string) => void) => () => void
          onEnd: (callback: (streamId: string) => void) => () => void
          onError: (callback: (streamId: string, error: string) => void) => () => void
          abort: (streamId?: string) => void
     }
     settings: {
          get: (key: string) => Promise<unknown>
          set: (key: string, value: unknown) => Promise<void>
          getAll: () => Promise<Record<string, unknown>>
          setApiKey: (apiKey: string) => Promise<void>
          hasApiKey: () => Promise<boolean>
     }
     files: {
          save: (content: string, defaultPath?: string) => Promise<string | null>
          open: () => Promise<{ content: string; path: string } | null>
          exportMD: (content: string) => Promise<string | null>
          scanFolder: () => Promise<{
               folderPath: string
               folderName: string
               tree: string
               keyFiles: Array<{ name: string; content: string }>
               fileCount: number
               dirCount: number
          }>
     }
     projects: {
          save: (id: string, data: unknown) => Promise<void>
          load: (id: string) => Promise<unknown>
          list: () => Promise<Array<{ id: string; name: string; updatedAt: number }>>
          delete: (id: string) => Promise<void>
     }
}

declare global {
     interface Window {
          electronAPI: IElectronAPI
     }
}
