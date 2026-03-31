export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'lmstudio' | 'custom'

export interface LLMConfig {
     provider: LLMProvider
     baseURL: string
     model: string
     temperature: number
     maxTokens: number
     deepPlanningMode: boolean
     targetNodeCount: number
     maxHierarchyDepth: number
     planningPasses: number
     notesDensity: 'standard' | 'dense'
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
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
}

export const PROVIDER_DEFAULTS: Record<LLMProvider, { baseURL: string; model: string }> = {
     openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
     anthropic: { baseURL: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
     ollama: { baseURL: 'http://localhost:11434/v1', model: 'llama3' },
     lmstudio: { baseURL: 'http://localhost:1234/v1', model: 'default' },
     custom: { baseURL: '', model: '' }
}
