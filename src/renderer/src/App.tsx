import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { ArchitectureCanvas } from './components/Canvas/ArchitectureCanvas'
import { ChatPanel } from './components/Chat/ChatPanel'
import { SettingsDialog } from './components/Settings/SettingsDialog'
import { ExportDialog } from './components/Export/ExportDialog'
import { useSettingsStore } from './store/settings-store'
import { useArchitectureStore } from './store/architecture-store'

export default function App() {
     const [showSettings, setShowSettings] = useState(false)
     const [showExport, setShowExport] = useState(false)
     const { loadSettings, isLoaded } = useSettingsStore()
     const title = useArchitectureStore((s) => s.title)

     useEffect(() => {
          loadSettings()
     }, [loadSettings])

     if (!isLoaded) {
          return (
               <div className="h-screen flex items-center justify-center bg-gray-950 text-gray-400">
                    Loading...
               </div>
          )
     }

     return (
          <div className="h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
               {/* Header */}
               <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <div className="flex items-center gap-3">
                         <h1 className="text-sm font-bold tracking-wide">
                              <span className="text-blue-500">arch</span>AI
                         </h1>
                         <span className="text-xs text-gray-500 dark:text-gray-400">{title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <button
                              onClick={() => setShowExport(true)}
                              className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                         >
                              Export
                         </button>
                         <button
                              onClick={() => setShowSettings(true)}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                         >
                              ⚙ Settings
                         </button>
                    </div>
               </header>

               {/* Main Content: Canvas + Chat */}
               <div className="flex flex-1 min-h-0">
                    {/* Canvas */}
                    <div className="flex-1 min-w-[400px]">
                         <ReactFlowProvider>
                              <ArchitectureCanvas />
                         </ReactFlowProvider>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-gray-200 dark:bg-gray-800" />

                    {/* Chat */}
                    <div className="w-[400px] shrink-0">
                         <ChatPanel />
                    </div>
               </div>

               {/* Dialogs */}
               <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />
               <ExportDialog isOpen={showExport} onClose={() => setShowExport(false)} />
          </div>
     )
}
