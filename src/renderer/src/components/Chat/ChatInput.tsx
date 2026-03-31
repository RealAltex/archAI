import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../store/chat-store'

export function ChatInput() {
     const [input, setInput] = useState('')
     const textareaRef = useRef<HTMLTextAreaElement>(null)
     const { sendMessage, abort, isStreaming } = useChatStore()

     // Auto-resize textarea
     useEffect(() => {
          const el = textareaRef.current
          if (el) {
               el.style.height = 'auto'
               el.style.height = Math.min(el.scrollHeight, 150) + 'px'
          }
     }, [input])

     const handleSend = () => {
          const trimmed = input.trim()
          if (!trimmed || isStreaming) return
          sendMessage(trimmed)
          setInput('')
     }

     const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
               e.preventDefault()
               handleSend()
          }
     }

     return (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
               <div className="flex items-end gap-2">
                    <textarea
                         ref={textareaRef}
                         value={input}
                         onChange={(e) => setInput(e.target.value)}
                         onKeyDown={handleKeyDown}
                         placeholder="Beschreib deine Software-Idee... (Ctrl+Enter)"
                         rows={1}
                         className="flex-1 resize-none px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {isStreaming ? (
                         <button
                              onClick={abort}
                              className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shrink-0"
                         >
                              ■ Stop
                         </button>
                    ) : (
                         <button
                              onClick={handleSend}
                              disabled={!input.trim()}
                              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                         >
                              Send
                         </button>
                    )}
               </div>
               <p className="text-xs text-gray-400 mt-1">Ctrl+Enter to send</p>
          </div>
     )
}
