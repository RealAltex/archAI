import OpenAI from 'openai'

interface LLMStreamConfig {
     provider: string
     apiKey: string
     baseURL: string
     model: string
     temperature: number
     maxTokens: number
}

class LLMService {
     private client: OpenAI | null = null
     private abortController: AbortController | null = null

     configure(config: LLMStreamConfig): void {
          this.client = new OpenAI({
               apiKey: config.apiKey || 'not-needed',
               baseURL: config.baseURL
          })
     }

     async *streamChat(
          messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
          config: LLMStreamConfig
     ): AsyncGenerator<string> {
          this.configure(config)
          if (!this.client) throw new Error('LLM client not configured')

          this.abortController = new AbortController()

          const stream = await this.client.chat.completions.create(
               {
                    model: config.model,
                    messages,
                    stream: true,
                    temperature: config.temperature,
                    max_tokens: config.maxTokens
               },
               { signal: this.abortController.signal }
          )

          for await (const chunk of stream) {
               const content = chunk.choices[0]?.delta?.content
               if (content) yield content
          }
     }

     abort(): void {
          this.abortController?.abort()
          this.abortController = null
     }
}

export const llmService = new LLMService()
