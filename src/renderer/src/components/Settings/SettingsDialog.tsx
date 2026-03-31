import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settings-store'
import type { LLMProvider } from '../../types/llm'
import { PROVIDER_DEFAULTS } from '../../types/llm'

interface SettingsDialogProps {
     isOpen: boolean
     onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
     const { llmConfig, theme, updateLLMConfig, setProvider, setTheme } = useSettingsStore()
     const [apiKey, setApiKey] = useState(llmConfig.apiKey)

     useEffect(() => {
          setApiKey(llmConfig.apiKey)
     }, [llmConfig.apiKey])

     if (!isOpen) return null

     const providers: { value: LLMProvider; label: string }[] = [
          { value: 'openai', label: 'OpenAI' },
          { value: 'anthropic', label: 'Anthropic' },
          { value: 'ollama', label: 'Ollama (Local)' },
          { value: 'lmstudio', label: 'LM Studio (Local)' },
          { value: 'custom', label: 'Custom' }
     ]

     const needsApiKey = llmConfig.provider !== 'ollama' && llmConfig.provider !== 'lmstudio'

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                         <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Settings</h2>
                         <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">
                              ✕
                         </button>
                    </div>

                    <div className="px-6 py-4 space-y-5">
                         {/* LLM Provider */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                   LLM Provider
                              </label>
                              <select
                                   title="LLM Provider"
                                   value={llmConfig.provider}
                                   onChange={(e) => setProvider(e.target.value as LLMProvider)}
                                   className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                              >
                                   {providers.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                   ))}
                              </select>
                         </div>

                         {/* API Key */}
                         {needsApiKey && (
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        API Key
                                   </label>
                                   <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        onBlur={() => updateLLMConfig({ apiKey })}
                                        placeholder="sk-..."
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                                   />
                              </div>
                         )}

                         {/* Base URL */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                   Base URL
                              </label>
                              <input
                                   type="text"
                                   value={llmConfig.baseURL}
                                   onChange={(e) => updateLLMConfig({ baseURL: e.target.value })}
                                   placeholder={PROVIDER_DEFAULTS[llmConfig.provider].baseURL}
                                   className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                              />
                         </div>

                         {/* Model */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                   Model
                              </label>
                              <input
                                   type="text"
                                   value={llmConfig.model}
                                   onChange={(e) => updateLLMConfig({ model: e.target.value })}
                                   placeholder={PROVIDER_DEFAULTS[llmConfig.provider].model}
                                   className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                              />
                         </div>

                         {/* Temperature */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                   Temperature: {llmConfig.temperature}
                              </label>
                              <input
                                   title="Temperature"
                                   type="range"
                                   min="0"
                                   max="2"
                                   step="0.1"
                                   value={llmConfig.temperature}
                                   onChange={(e) => updateLLMConfig({ temperature: parseFloat(e.target.value) })}
                                   className="w-full"
                              />
                         </div>

                         <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                   Theme
                              </label>
                              <div className="flex gap-2">
                                   <button
                                        onClick={() => setTheme('system')}
                                        className={`flex-1 px-3 py-2 text-sm rounded-lg border ${theme === 'system'
                                                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                  : 'border-gray-200 dark:border-gray-700'
                                             }`}
                                   >
                                        💻 System
                                   </button>
                                   <button
                                        onClick={() => setTheme('light')}
                                        className={`flex-1 px-3 py-2 text-sm rounded-lg border ${theme === 'light'
                                                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                  : 'border-gray-200 dark:border-gray-700'
                                             }`}
                                   >
                                        ☀️ Light
                                   </button>
                                   <button
                                        onClick={() => setTheme('dark')}
                                        className={`flex-1 px-3 py-2 text-sm rounded-lg border ${theme === 'dark'
                                                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                  : 'border-gray-200 dark:border-gray-700'
                                             }`}
                                   >
                                        🌙 Dark
                                   </button>
                              </div>
                         </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                         <button
                              onClick={onClose}
                              className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                         >
                              Done
                         </button>
                    </div>
               </div>
          </div>
     )
}
