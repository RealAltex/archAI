import { useCallback, useEffect } from 'react'
import { useArchitectureStore } from '../../store/architecture-store'

interface NodeContextMenuProps {
     nodeId: string
     x: number
     y: number
     onClose: () => void
     onEdit: (nodeId: string) => void
}

export function NodeContextMenu({ nodeId, x, y, onClose, onEdit }: NodeContextMenuProps) {
     const { deleteNode, duplicateNode } = useArchitectureStore()

     const handleDelete = useCallback(() => {
          deleteNode(nodeId)
          onClose()
     }, [deleteNode, nodeId, onClose])

     const handleDuplicate = useCallback(() => {
          duplicateNode(nodeId)
          onClose()
     }, [duplicateNode, nodeId, onClose])

     const handleEdit = useCallback(() => {
          onEdit(nodeId)
          onClose()
     }, [onEdit, nodeId, onClose])

     useEffect(() => {
          const handler = () => onClose()
          window.addEventListener('click', handler)
          return () => window.removeEventListener('click', handler)
     }, [onClose])

     return (
          <div
               className="fixed z-[100] min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 text-sm"
               style={{ top: y, left: x }}
               onClick={(e) => e.stopPropagation()}
          >
               <button
                    onClick={handleEdit}
                    className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
               >
                    <span className="w-4 text-center">✏️</span> Edit
               </button>
               <button
                    onClick={handleDuplicate}
                    className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
               >
                    <span className="w-4 text-center">📋</span> Duplicate
               </button>
               <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
               <button
                    onClick={handleDelete}
                    className="w-full px-3 py-1.5 text-left hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2"
               >
                    <span className="w-4 text-center">🗑️</span> Delete
               </button>
          </div>
     )
}
