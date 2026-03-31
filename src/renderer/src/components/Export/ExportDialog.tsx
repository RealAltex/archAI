import { useState } from 'react'
import { useArchitectureStore } from '../../store/architecture-store'
import { transformToExportMD } from '../../lib/md-schema/export-transformer'

interface ExportDialogProps {
     isOpen: boolean
     onClose: () => void
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
     const [preview, setPreview] = useState('')
     const [exported, setExported] = useState(false)
     const getArchitectureData = useArchitectureStore((s) => s.getArchitectureData)

     const handlePreview = () => {
          const data = getArchitectureData()
          const exportMD = transformToExportMD(data)
          setPreview(exportMD)
     }

     const handleExport = async () => {
          let content = preview
          if (!content) {
               const data = getArchitectureData()
               content = transformToExportMD(data)
          }

          const result = await window.electronAPI.files.exportMD(content)
          if (result) {
               setExported(true)
               setTimeout(() => setExported(false), 2000)
          }
     }

     if (!isOpen) return null

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                         <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Export Architecture</h2>
                         <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">
                              ✕
                         </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                         {!preview ? (
                              <div className="text-center py-8">
                                   <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Export your architecture as an AI-optimized Markdown file.
                                        It will include relationship context, a dependency graph, and structured descriptions.
                                   </p>
                                   <button
                                        onClick={handlePreview}
                                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                   >
                                        Generate Preview
                                   </button>
                              </div>
                         ) : (
                              <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                                   {preview}
                              </pre>
                         )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                         <button
                              onClick={handleExport}
                              className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                         >
                              {exported ? '✓ Saved!' : 'Export as .md'}
                         </button>
                         <button
                              onClick={onClose}
                              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                         >
                              Close
                         </button>
                    </div>
               </div>
          </div>
     )
}
