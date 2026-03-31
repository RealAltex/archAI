import { useState } from 'react'
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
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
               <button
                    onClick={() => applyLayout()}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Auto Layout"
               >
                    ⬡ Layout
               </button>

               <select
                    title="Layout direction"
                    value={layoutDirection}
                    onChange={(e) => {
                         setLayoutDirection(e.target.value as LayoutDirection)
                         applyLayout(e.target.value as LayoutDirection)
                    }}
                    className="text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-1.5 border-none"
               >
                    <option value="TB">↓ Top-Down</option>
                    <option value="LR">→ Left-Right</option>
               </select>

               <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

               <button
                    onClick={() => setShowAddDialog(!showAddDialog)}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
               >
                    + Add Node
               </button>

               {showAddDialog && (
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 w-64 z-50">
                         <input
                              type="text"
                              value={newNodeLabel}
                              onChange={(e) => setNewNodeLabel(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
                              placeholder="Node name..."
                              className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border rounded mb-2"
                              autoFocus
                         />
                         <select
                              title="Node level"
                              value={newNodeLevel}
                              onChange={(e) => setNewNodeLevel(e.target.value)}
                              className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border rounded mb-2"
                         >
                              <option value="system">System</option>
                              <option value="container">Container</option>
                              <option value="component">Component</option>
                              <option value="code">Code</option>
                         </select>
                         <div className="flex gap-2">
                              <button onClick={handleAddNode} className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                   Add
                              </button>
                              <button onClick={() => setShowAddDialog(false)} className="flex-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300">
                                   Cancel
                              </button>
                         </div>
                    </div>
               )}
          </div>
     )
}
