export interface IElectronAPI {
     llm: {
          startStream: (messages: Array<{ role: string; content: string }>, config: {
               provider: string; apiKey: string; baseURL: string;
               model: string; temperature: number; maxTokens: number
          }) => void
          onChunk: (callback: (chunk: string) => void) => () => void
          onEnd: (callback: () => void) => () => void
          onError: (callback: (error: string) => void) => () => void
          abort: () => void
     }
     settings: {
          get: (key: string) => Promise<unknown>
          set: (key: string, value: unknown) => Promise<void>
          getAll: () => Promise<Record<string, unknown>>
     }
     files: {
          save: (content: string, defaultPath?: string) => Promise<string | null>
          open: () => Promise<{ content: string; path: string } | null>
          exportMD: (content: string) => Promise<string | null>
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
