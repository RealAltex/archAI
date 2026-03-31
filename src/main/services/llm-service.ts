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
     private createClient(config: LLMStreamConfig): OpenAI {
          return new OpenAI({
               apiKey: config.apiKey || 'not-needed',
               baseURL: config.baseURL
          })
     }

     async *streamChat(
          messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
          config: LLMStreamConfig,
          signal?: AbortSignal
     ): AsyncGenerator<string> {
          const client = this.createClient(config)

          const stream = await client.chat.completions.create(
               {
                    model: config.model,
                    messages,
                    stream: true,
                    temperature: config.temperature,
                    max_tokens: config.maxTokens
               },
               { signal }
          )

          for await (const chunk of stream) {
               const content = chunk.choices[0]?.delta?.content
               if (content) yield content
          }
     }
}

export const llmService = new LLMService()
