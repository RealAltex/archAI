import { create } from 'zustand'
import type { LLMConfig, LLMProvider } from '../types/llm'
import { DEFAULT_LLM_CONFIG, PROVIDER_DEFAULTS } from '../types/llm'

type Theme = 'light' | 'dark' | 'system'

function normalizeLLMConfig(value: unknown): LLMConfig {
     if (!value || typeof value !== 'object') return DEFAULT_LLM_CONFIG

     const partial = value as Partial<LLMConfig>
     return {
          ...DEFAULT_LLM_CONFIG,
          ...partial,
          notesDensity: partial.notesDensity === 'standard' ? 'standard' : 'dense'
     }
}

function getEffectiveDark(theme: Theme): boolean {
     if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
     }
     return theme === 'dark'
}

function applyThemeToDOM(theme: Theme) {
     document.documentElement.classList.toggle('dark', getEffectiveDark(theme))
}

interface SettingsStore {
     llmConfig: LLMConfig
     theme: Theme
     isLoaded: boolean
     hasApiKey: boolean

     loadSettings: () => Promise<void>
     updateLLMConfig: (config: Partial<LLMConfig>) => void
     setProvider: (provider: LLMProvider) => void
     setTheme: (theme: Theme) => void
     setApiKey: (apiKey: string) => Promise<void>
     saveSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
     llmConfig: DEFAULT_LLM_CONFIG,
     theme: 'system',
     isLoaded: false,
     hasApiKey: false,

     loadSettings: async () => {
          const settings = await window.electronAPI.settings.getAll()
          const theme = (settings.theme as Theme) || 'system'
          applyThemeToDOM(theme)
          set({
               llmConfig: normalizeLLMConfig(settings.llmConfig),
               theme,
               hasApiKey: Boolean(settings.hasApiKey),
               isLoaded: true
          })

          // Listen for OS theme changes when in system mode
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
               const currentTheme = get().theme
               if (currentTheme === 'system') {
                    applyThemeToDOM('system')
               }
          })
     },

     updateLLMConfig: (config) => {
          set((state) => ({
               llmConfig: { ...state.llmConfig, ...config }
          }))
          get().saveSettings()
     },

     setProvider: (provider) => {
          const defaults = PROVIDER_DEFAULTS[provider]
          set((state) => ({
               llmConfig: {
                    ...state.llmConfig,
                    provider,
                    baseURL: defaults.baseURL,
                    model: defaults.model
               }
          }))
          get().saveSettings()
     },

     setTheme: (theme) => {
          applyThemeToDOM(theme)
          set({ theme })
          get().saveSettings()
     },

     setApiKey: async (apiKey: string) => {
          await window.electronAPI.settings.setApiKey(apiKey)
          set({ hasApiKey: apiKey.length > 0 })
     },

     saveSettings: async () => {
          const { llmConfig, theme } = get()
          await window.electronAPI.settings.set('llmConfig', llmConfig)
          await window.electronAPI.settings.set('theme', theme)
     }
}))
