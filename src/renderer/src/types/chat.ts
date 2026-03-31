export interface ChatMessage {
     id: string
     role: 'user' | 'assistant' | 'system'
     content: string
     timestamp: number
}

export interface ChatState {
     messages: ChatMessage[]
     isStreaming: boolean
     error: string | null
}
