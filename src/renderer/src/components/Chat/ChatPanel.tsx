import { useEffect, useRef } from 'react'
import { useChatStore } from '../../store/chat-store'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

export function ChatPanel() {
     const { messages, isStreaming, streamingContent, error } = useChatStore()
     const messagesEndRef = useRef<HTMLDivElement>(null)

     useEffect(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
     }, [messages, streamingContent])

     // Register IPC listeners for LLM streaming
     useEffect(() => {
          const unsubChunk = window.electronAPI.llm.onChunk((chunk) => {
               useChatStore.getState().appendChunk(chunk)
          })
          const unsubEnd = window.electronAPI.llm.onEnd(() => {
               useChatStore.getState().endStream()
          })
          const unsubError = window.electronAPI.llm.onError((error) => {
               useChatStore.getState().setError(error)
          })

          return () => {
               unsubChunk()
               unsubEnd()
               unsubError()
          }
     }, [])

     return (
          <div className="flex flex-col h-full bg-white dark:bg-gray-900">
               {/* Header */}
               <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Assistant</h2>
                    <button
                         onClick={() => useChatStore.getState().clearChat()}
                         className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                         Clear
                    </button>
               </div>

               {/* Messages */}
               <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                    {messages.length === 0 && !isStreaming && (
                         <div className="text-center text-gray-400 dark:text-gray-500 mt-12 px-6">
                              <p className="text-2xl mb-3">🏗️</p>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                   Beschreib einfach deine Software-Idee
                              </p>
                              <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                                   Egal ob nur eine vage Idee, ein konkreter Plan oder ein bestehendes Projekt
                                   — ich denke mit und baue die Architektur für dich auf.
                              </p>
                              <div className="mt-4 space-y-1.5 text-xs text-gray-400 dark:text-gray-600">
                                   <p>&quot;Ich will eine App bauen, mit der man Rezepte teilen kann&quot;</p>
                                   <p>&quot;Ich plane ein SaaS mit React Frontend und Python Backend&quot;</p>
                                   <p>&quot;Ich hab schon ein Express Backend, brauche aber eine bessere Struktur&quot;</p>
                              </div>
                         </div>
                    )}

                    {messages.map((msg) => (
                         <MessageBubble key={msg.id} message={msg} />
                    ))}

                    {isStreaming && streamingContent && (
                         <MessageBubble
                              message={{
                                   id: 'streaming',
                                   role: 'assistant',
                                   content: streamingContent,
                                   timestamp: Date.now()
                              }}
                         />
                    )}

                    {isStreaming && !streamingContent && (
                         <div className="flex items-center gap-2 text-gray-400">
                              <div className="flex gap-1">
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                              </div>
                              <span className="text-xs">Thinking...</span>
                         </div>
                    )}

                    {error && (
                         <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs text-red-600 dark:text-red-400">
                              {error}
                         </div>
                    )}

                    <div ref={messagesEndRef} />
               </div>

               {/* Input */}
               <ChatInput />
          </div>
     )
}
