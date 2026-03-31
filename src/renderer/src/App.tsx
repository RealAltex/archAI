import { useState, useEffect, useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { FilePlus, FolderOpen, Save, Download, Settings, Trash2, Loader } from 'lucide-react'
import { ArchitectureCanvas } from './components/Canvas/ArchitectureCanvas'
import { ChatPanel } from './components/Chat/ChatPanel'
import { SettingsDialog } from './components/Settings/SettingsDialog'
import { ExportDialog } from './components/Export/ExportDialog'
import { useSettingsStore } from './store/settings-store'
import { useArchitectureStore } from './store/architecture-store'
import { useChatStore } from './store/chat-store'

export default function App() {
     const [showSettings, setShowSettings] = useState(false)
     const [showExport, setShowExport] = useState(false)
     const [showProjectList, setShowProjectList] = useState(false)
     const [projects, setProjects] = useState<Array<{ id: string; name: string; updatedAt: number }>>([])
     const [editingTitle, setEditingTitle] = useState(false)
     const titleInputRef = useRef<HTMLInputElement>(null)

     const { loadSettings, isLoaded } = useSettingsStore()
     const title = useArchitectureStore((s) => s.title)
     const dirty = useArchitectureStore((s) => s.dirty)
     const setTitle = useArchitectureStore((s) => s.setTitle)
     const saveProject = useArchitectureStore((s) => s.saveProject)
     const loadProject = useArchitectureStore((s) => s.loadProject)
     const listProjects = useArchitectureStore((s) => s.listProjects)
     const deleteProject = useArchitectureStore((s) => s.deleteProject)
     const newProject = useArchitectureStore((s) => s.newProject)
     const chatAnalyzeProject = useChatStore((s) => s.analyzeProject)
     const chatIsAnalyzingFolder = useChatStore((s) => s.isAnalyzingFolder)

     useEffect(() => {
          loadSettings()
     }, [loadSettings])

     useEffect(() => {
          if (editingTitle && titleInputRef.current) {
               titleInputRef.current.focus()
               titleInputRef.current.select()
          }
     }, [editingTitle])

     const handleOpenProjectList = async () => {
          const list = await listProjects()
          setProjects(list)
          setShowProjectList(true)
     }

     const handleLoadProject = async (id: string) => {
          await loadProject(id)
          setShowProjectList(false)
     }

     const handleDeleteProject = async (id: string) => {
          await deleteProject(id)
          const list = await listProjects()
          setProjects(list)
     }

     const handleScanFolder = async () => {
          try {
               const scan = await window.electronAPI.files.scanFolder()
               chatAnalyzeProject(scan)
          } catch (e) {
               console.error('Failed to scan folder:', e)
          }
     }

     const handleTitleSubmit = () => {
          setEditingTitle(false)
          if (!title.trim()) setTitle('Untitled Project')
     }

     if (!isLoaded) {
          return (
               <div className="h-screen flex items-center justify-center bg-gray-950 text-gray-400">
                    Loading...
               </div>
          )
     }

     return (
          <div className="h-screen flex flex-col" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}>
               {/* Header */}
               <header className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                         <h1 className="text-sm font-bold tracking-wide">
                              <span style={{ color: 'var(--accent)' }}>arch</span>AI
                         </h1>
                         <div className="w-px h-4" style={{ background: 'var(--border)' }} />
                         {editingTitle ? (
                              <input
                                   ref={titleInputRef}
                                   type="text"
                                   value={title}
                                   onChange={(e) => setTitle(e.target.value)}
                                   onBlur={handleTitleSubmit}
                                   onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTitleSubmit()
                                        if (e.key === 'Escape') {
                                             setEditingTitle(false)
                                        }
                                   }}
                                   className="text-xs rounded-md px-2 py-0.5 w-48 border focus:outline-none focus:ring-2"
                                   style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                                   placeholder="Project name..."
                              />
                         ) : (
                              <button
                                   onClick={() => setEditingTitle(true)}
                                   className="text-xs transition-colors cursor-pointer hover:opacity-80"
                                   style={{ color: 'var(--text-secondary)' }}
                                   title="Click to rename project"
                              >
                                   {title}
                                   {dirty && <span className="ml-1" style={{ color: '#eab308' }}>*</span>}
                              </button>
                         )}
                    </div>
                    <div className="flex items-center gap-1.5">
                         <button
                              onClick={newProject}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-[var(--surface-3)]"
                              style={{ color: 'var(--text-secondary)' }}
                              title="New project"
                         >
                              <FilePlus size={14} />
                              New
                         </button>
                         <button
                              onClick={handleOpenProjectList}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-[var(--surface-3)]"
                              style={{ color: 'var(--text-secondary)' }}
                              title="Open project"
                         >
                              <FolderOpen size={14} />
                              Open
                         </button>
                         <button
                              onClick={handleScanFolder}
                              disabled={chatIsAnalyzingFolder}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                              title="Scan project folder"
                         >
                              {chatIsAnalyzingFolder ? <Loader size={14} className="animate-spin" /> : <FolderOpen size={14} />}
                              Scan
                         </button>
                         <button
                              onClick={() => saveProject()}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                              style={{ background: 'var(--accent)' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
                              title="Save project"
                         >
                              <Save size={14} />
                              Save
                         </button>
                         <div className="w-px h-4" style={{ background: 'var(--border)' }} />
                         <button
                              onClick={() => setShowExport(true)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-[var(--surface-3)]"
                              style={{ color: 'var(--node-container)' }}
                         >
                              <Download size={14} />
                              Export
                         </button>
                         <button
                              onClick={() => setShowSettings(true)}
                              className="flex items-center gap-1.5 p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-3)]"
                              style={{ color: 'var(--text-secondary)' }}
                         >
                              <Settings size={15} />
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

               {/* Project list dialog */}
               {showProjectList && (
                    <div
                         className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
                         onClick={() => setShowProjectList(false)}
                    >
                         <div
                              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[400px] max-h-[60vh] flex flex-col"
                              onClick={(e) => e.stopPropagation()}
                         >
                              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                                   <h2 className="text-sm font-semibold">Open Project</h2>
                              </div>
                              <div className="flex-1 overflow-y-auto">
                                   {projects.length === 0 ? (
                                        <div className="px-5 py-8 text-center text-xs text-gray-500">
                                             No saved projects yet.
                                        </div>
                                   ) : (
                                        projects.map((p) => (
                                             <div
                                                  key={p.id}
                                                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                                             >
                                                  <button
                                                       onClick={() => handleLoadProject(p.id)}
                                                       className="flex-1 text-left"
                                                  >
                                                       <div className="text-sm font-medium">{p.name}</div>
                                                       <div className="text-xs text-gray-500">
                                                            {p.updatedAt
                                                                 ? new Date(p.updatedAt).toLocaleDateString()
                                                                 : 'Unknown'}
                                                       </div>
                                                  </button>
                                                  <button
                                                       onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteProject(p.id)
                                                       }}
                                                       className="ml-2 p-1 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                       title="Delete project"
                                                  >
                                                       🗑️
                                                  </button>
                                             </div>
                                        ))
                                   )}
                              </div>
                              <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                   <button
                                        onClick={() => setShowProjectList(false)}
                                        className="px-4 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                                   >
                                        Close
                                   </button>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     )
}
