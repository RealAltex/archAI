import Store from 'electron-store'
import { safeStorage } from 'electron'

// Allowed setting keys — reject anything else
const ALLOWED_KEYS = new Set(['llmConfig', 'theme', 'layoutDirection', 'encryptedApiKey'])

const store = new Store({
     name: 'archai-settings',
     defaults: {
          llmConfig: {
               provider: 'openai',
               baseURL: 'https://api.openai.com/v1',
               model: 'gpt-4o',
               temperature: 0.7,
               maxTokens: 4096,
               deepPlanningMode: true,
               targetNodeCount: 450,
               maxHierarchyDepth: 12,
               planningPasses: 4,
               notesDensity: 'dense'
          },
          encryptedApiKey: '',
          theme: 'dark',
          layoutDirection: 'TB'
     }
})

// --- Migration: move plaintext apiKey into encrypted storage on first run ---
function migrateApiKey(): void {
     const llmConfig = store.get('llmConfig') as Record<string, unknown> | undefined
     if (llmConfig && typeof llmConfig.apiKey === 'string' && llmConfig.apiKey.length > 0) {
          const encrypted = encryptApiKey(llmConfig.apiKey)
          store.set('encryptedApiKey', encrypted)
          // Remove plaintext key from llmConfig
          const { apiKey: _removed, ...rest } = llmConfig
          store.set('llmConfig', rest)
     }
}

// Run migration immediately when module loads (after app ready)
try {
     migrateApiKey()
} catch {
     // safeStorage may not be ready yet; will retry in initSecureStorage
}

export function initSecureStorage(): void {
     migrateApiKey()
}

// --- Encryption helpers ---
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

// --- Secure API key access (key never leaves main process as plaintext via IPC) ---
export function setApiKey(apiKey: string): void {
     if (!apiKey || apiKey.length === 0) {
          store.set('encryptedApiKey', '')
          return
     }
     store.set('encryptedApiKey', encryptApiKey(apiKey))
}

export function getApiKey(): string {
     const encrypted = store.get('encryptedApiKey') as string
     if (!encrypted) return ''
     return decryptApiKey(encrypted)
}

export function hasApiKey(): boolean {
     const encrypted = store.get('encryptedApiKey') as string
     return Boolean(encrypted && encrypted.length > 0)
}

// --- General settings (with key whitelisting) ---
export function getSetting(key: string): unknown {
     if (!ALLOWED_KEYS.has(key)) {
          throw new Error(`Access to setting "${key}" is not allowed`)
     }
     // Never expose encrypted key through generic getter
     if (key === 'encryptedApiKey') return undefined
     return store.get(key)
}

export function setSetting(key: string, value: unknown): void {
     if (!ALLOWED_KEYS.has(key)) {
          throw new Error(`Setting "${key}" is not allowed`)
     }
     // Block setting encryptedApiKey through generic setter — must use setApiKey()
     if (key === 'encryptedApiKey') {
          throw new Error('Use the dedicated API key channel to set the API key')
     }
     // Strip apiKey if someone tries to sneak it through llmConfig
     if (key === 'llmConfig' && typeof value === 'object' && value !== null) {
          const { apiKey: _stripped, ...sanitized } = value as Record<string, unknown>
          store.set(key, sanitized)
          return
     }
     store.set(key, value)
}

export function getAllSettings(): Record<string, unknown> {
     const all = { ...store.store }
     // Never return encrypted key data — only a boolean flag
     delete all.encryptedApiKey
     // Strip any residual apiKey from llmConfig
     if (all.llmConfig && typeof all.llmConfig === 'object') {
          const { apiKey: _stripped, ...sanitizedConfig } = all.llmConfig as Record<string, unknown>
          all.llmConfig = sanitizedConfig
     }
     all.hasApiKey = hasApiKey()
     return all
}
