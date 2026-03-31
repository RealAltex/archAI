import { useState, useEffect } from 'react'
import { useArchitectureStore } from '../../store/architecture-store'
import type { FlowNodeData } from '../../lib/flow-adapter'

function toTextList(value?: string[]): string {
     return (value || []).join('\n')
}

function fromTextList(value: string): string[] {
     return value
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
}

interface NodeEditDialogProps {
     nodeId: string
     onClose: () => void
}

export function NodeEditDialog({ nodeId, onClose }: NodeEditDialogProps) {
     const nodes = useArchitectureStore((s) => s.nodes)
     const updateNode = useArchitectureStore((s) => s.updateNode)
     const node = nodes.find((n) => n.id === nodeId)

     const [label, setLabel] = useState('')
     const [description, setDescription] = useState('')
     const [technology, setTechnology] = useState('')
     const [level, setLevel] = useState('system')
     const [legacyNotes, setLegacyNotes] = useState('')
     const [notesSummary, setNotesSummary] = useState('')
     const [notesResponsibilities, setNotesResponsibilities] = useState('')
     const [notesDecisions, setNotesDecisions] = useState('')
     const [notesRisks, setNotesRisks] = useState('')
     const [notesNextSteps, setNotesNextSteps] = useState('')

     useEffect(() => {
          if (node) {
               const d = node.data as FlowNodeData
               setLabel(d.label || '')
               setDescription(d.description || '')
               setTechnology(d.technology || '')
               setLevel(d.level || 'system')
               setLegacyNotes(d.notes || '')
               setNotesSummary((d.noteBlocks?.summary as string) || '')
               setNotesResponsibilities(toTextList(d.noteBlocks?.responsibilities as string[] | undefined))
               setNotesDecisions(toTextList(d.noteBlocks?.decisions as string[] | undefined))
               setNotesRisks(toTextList(d.noteBlocks?.risks as string[] | undefined))
               setNotesNextSteps(toTextList(d.noteBlocks?.nextSteps as string[] | undefined))
          }
     }, [node])

     if (!node) return null

     const handleSave = () => {
          updateNode(nodeId, {
               label,
               description,
               technology,
               level,
               notes: legacyNotes.trim() || undefined,
               noteBlocks: {
                    summary: notesSummary.trim() || undefined,
                    responsibilities: fromTextList(notesResponsibilities),
                    decisions: fromTextList(notesDecisions),
                    risks: fromTextList(notesRisks),
                    nextSteps: fromTextList(notesNextSteps)
               }
          })
          onClose()
     }

     return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={onClose}>
               <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[420px] max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
               >
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                         <h2 className="text-sm font-semibold">Edit Node</h2>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                         <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                   Name
                              </label>
                              <input
                                   type="text"
                                   title="Node name"
                                   value={label}
                                   onChange={(e) => setLabel(e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                   className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md"
                                   autoFocus
                              />
                         </div>
                         <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                   Level
                              </label>
                              <select
                                   title="Node level"
                                   value={level}
                                   onChange={(e) => setLevel(e.target.value)}
                                   className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md"
                              >
                                   <option value="system">System</option>
                                   <option value="container">Container</option>
                                   <option value="component">Component</option>
                                   <option value="code">Code</option>
                              </select>
                         </div>
                         <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                   Technology
                              </label>
                              <input
                                   type="text"
                                   value={technology}
                                   onChange={(e) => setTechnology(e.target.value)}
                                   className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md"
                                   placeholder="e.g. React, Node.js, PostgreSQL..."
                              />
                         </div>
                         <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                   Description
                              </label>
                              <textarea
                                   value={description}
                                   onChange={(e) => setDescription(e.target.value)}
                                   rows={3}
                                   className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                                   placeholder="What does this block do?"
                              />
                         </div>

                         <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                   Structured Notes
                              </label>

                              <div>
                                   <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Summary
                                   </label>
                                   <textarea
                                        value={notesSummary}
                                        onChange={(e) => setNotesSummary(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                                        placeholder="Kurz zusammenfassen, worum es hier geht"
                                   />
                              </div>

                              <div>
                                   <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Responsibilities (one per line)
                                   </label>
                                   <textarea
                                        value={notesResponsibilities}
                                        onChange={(e) => setNotesResponsibilities(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                                        placeholder="Verantwortung 1&#10;Verantwortung 2"
                                   />
                              </div>

                              <div>
                                   <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Decisions (one per line)
                                   </label>
                                   <textarea
                                        value={notesDecisions}
                                        onChange={(e) => setNotesDecisions(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                                        placeholder="Entscheidung 1&#10;Entscheidung 2"
                                   />
                              </div>

                              <div>
                                   <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Risks (one per line)
                                   </label>
                                   <textarea
                                        value={notesRisks}
                                        onChange={(e) => setNotesRisks(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                                        placeholder="Risiko 1&#10;Risiko 2"
                                   />
                              </div>

                              <div>
                                   <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Next Steps (one per line)
                                   </label>
                                   <textarea
                                        value={notesNextSteps}
                                        onChange={(e) => setNotesNextSteps(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                                        placeholder="Nächster Schritt 1&#10;Nächster Schritt 2"
                                   />
                              </div>

                              <div>
                                   <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Legacy Notes
                                   </label>
                                   <textarea
                                        value={legacyNotes}
                                        onChange={(e) => setLegacyNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                                        placeholder="Freitext-Notizen (optional)"
                                   />
                              </div>
                         </div>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                         <button
                              onClick={onClose}
                              className="px-4 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                         >
                              Cancel
                         </button>
                         <button
                              onClick={handleSave}
                              className="px-4 py-1.5 text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
                         >
                              Save
                         </button>
                    </div>
               </div>
          </div>
     )
}
