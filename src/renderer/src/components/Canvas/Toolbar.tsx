import { useState } from 'react'
import { LayoutGrid, Plus, ChevronDown } from 'lucide-react'
import { useArchitectureStore } from '../../store/architecture-store'
import type { LayoutDirection } from './layout'

export function Toolbar() {
     const [showAddDialog, setShowAddDialog] = useState(false)
     const [newNodeLabel, setNewNodeLabel] = useState('')
     const [newNodeLevel, setNewNodeLevel] = useState('system')
     const { applyLayout, layoutDirection, setLayoutDirection, addNode } = useArchitectureStore()

     const handleAddNode = () => {
          if (newNodeLabel.trim()) {
               addNode(newNodeLabel.trim(), newNodeLevel)
               setNewNodeLabel('')
               setShowAddDialog(false)
          }
     }

     return (
          <div className="flex items-center gap-1.5 bg-[var(--surface-2)]/80 backdrop-blur-xl rounded-xl shadow-lg px-2 py-1.5 border border-[var(--border)]">
               <button
                    onClick={() => applyLayout()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-[var(--surface-3)]"
                    style={{ color: 'var(--text-secondary)' }}
                    title="Auto Layout"
               >
                    <LayoutGrid size={13} />
                    Layout
               </button>

               <div className="relative">
                    <select
                         title="Layout direction"
                         value={layoutDirection}
                         onChange={(e) => {
                              setLayoutDirection(e.target.value as LayoutDirection)
                              applyLayout(e.target.value as LayoutDirection)
                         }}
                         className="appearance-none text-xs font-medium rounded-lg px-2.5 py-1.5 pr-6 transition-colors cursor-pointer hover:bg-[var(--surface-3)]"
                         style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none' }}
                    >
                         <option value="TB">📊 Top-Down</option>
                         <option value="LR">➡️ Left-Right</option>
                         <option value="RL">⬅️ Right-Left</option>
                         <option value="BT">📈 Bottom-Top</option>
                    </select>
                    <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
               </div>

               <div className="w-px h-5 bg-[var(--border)]" />

               <button
                    onClick={() => setShowAddDialog(!showAddDialog)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                    style={{ background: 'var(--accent)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
               >
                    <Plus size={13} />
                    Add Node
               </button>

               {showAddDialog && (
                    <div className="absolute top-full right-0 mt-2 rounded-xl shadow-2xl p-3 w-64 z-50 border"
                         style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
                         <input
                              type="text"
                              value={newNodeLabel}
                              onChange={(e) => setNewNodeLabel(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
                              placeholder="Node name..."
                              className="w-full px-2.5 py-1.5 text-sm rounded-lg mb-2 border focus:outline-none focus:ring-2"
                              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                              autoFocus
                         />
                         <select
                              title="Node level"
                              value={newNodeLevel}
                              onChange={(e) => setNewNodeLevel(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-sm rounded-lg mb-2 border"
                              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                         >
                              <option value="system">System</option>
                              <option value="container">Container</option>
                              <option value="component">Component</option>
                              <option value="code">Code</option>
                         </select>
                         <div className="flex gap-2">
                              <button
                                   onClick={handleAddNode}
                                   className="flex-1 px-2 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                                   style={{ background: 'var(--accent)' }}
                              >
                                   Add
                              </button>
                              <button
                                   onClick={() => setShowAddDialog(false)}
                                   className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                   style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                              >
                                   Cancel
                              </button>
                         </div>
                    </div>
               )}
          </div>
     )
}
