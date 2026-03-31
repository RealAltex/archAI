import type { ChatMessage } from '../../types/chat'

interface MessageBubbleProps {
     message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
     const isUser = message.role === 'user'

     // Simple markdown-ish rendering: detect ```archai blocks
     const renderContent = (content: string) => {
          const parts = content.split(/(```archai[\s\S]*?```|```[\s\S]*?```)/g)

          return parts.map((part, i) => {
               if (part.startsWith('```archai')) {
                    return (
                         <div key={i} className="mt-2 mb-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-xs font-medium text-blue-700 dark:text-blue-300">
                                   <span>📐 Architecture Schema</span>
                                   <span className="text-blue-500">✓ Applied to canvas</span>
                              </div>
                              <pre className="px-3 py-2 text-xs overflow-x-auto text-gray-700 dark:text-gray-300">
                                   <code>{part.replace(/```archai\n?/, '').replace(/```$/, '')}</code>
                              </pre>
                         </div>
                    )
               }
               if (part.startsWith('```')) {
                    return (
                         <pre key={i} className="mt-2 mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs overflow-x-auto">
                              <code>{part.replace(/```\w*\n?/, '').replace(/```$/, '')}</code>
                         </pre>
                    )
               }
               // Simple text with bold rendering
               return (
                    <span key={i} className="whitespace-pre-wrap">
                         {part.split(/(\*\*.*?\*\*)/g).map((segment, j) => {
                              if (segment.startsWith('**') && segment.endsWith('**')) {
                                   return <strong key={j}>{segment.slice(2, -2)}</strong>
                              }
                              return segment
                         })}
                    </span>
               )
          })
     }

     return (
          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
               <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${isUser
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                         }`}
               >
                    {renderContent(message.content)}
               </div>
          </div>
     )
}
