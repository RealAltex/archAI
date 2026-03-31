import Store from 'electron-store'
import { safeStorage } from 'electron'

const store = new Store({
     name: 'archai-settings',
     defaults: {
          llmConfig: {
               provider: 'openai',
               apiKey: '',
               baseURL: 'https://api.openai.com/v1',
               model: 'gpt-4o',
               temperature: 0.7,
               maxTokens: 4096
          },
          theme: 'dark',
          layoutDirection: 'TB'
     }
})

export function getSetting(key: string): unknown {
     return store.get(key)
}

export function setSetting(key: string, value: unknown): void {
     store.set(key, value)
}

export function getAllSettings(): Record<string, unknown> {
     return store.store
}

export function encryptApiKey(apiKey: string): string {
     if (!safeStorage.isEncryptionAvailable()) return apiKey
     return safeStorage.encryptString(apiKey).toString('base64')
}

export function decryptApiKey(encrypted: string): string {
     if (!safeStorage.isEncryptionAvailable()) return encrypted
     try {
          return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
     } catch {
          return encrypted
     }
}
