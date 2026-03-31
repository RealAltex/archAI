import {
     ReactFlow,
     Background,
     BackgroundVariant,
     Controls,
     MiniMap,
     Panel,
     useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { useArchitectureStore } from '../../store/architecture-store'
import { useSettingsStore } from '../../store/settings-store'
import { nodeTypes } from './nodes'
import { Toolbar } from './Toolbar'
import { NodeContextMenu } from './NodeContextMenu'
import { NodeEditDialog } from './NodeEditDialog'

export function ArchitectureCanvas() {
     const { nodes, edges, onNodesChange, onEdgesChange, onConnect, deleteNodes, duplicateNodes, layoutDirection } =
          useArchitectureStore()
     const theme = useSettingsStore((s) => s.theme)
     const { fitView } = useReactFlow()
     const prevNodeCount = useRef(nodes.length)
     const prevLayoutDir = useRef(layoutDirection)

     const [contextMenu, setContextMenu] = useState<{
          nodeId: string
          x: number
          y: number
     } | null>(null)
     const [editNodeId, setEditNodeId] = useState<string | null>(null)

     const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id)

     const colorMode =
          theme === 'system'
               ? window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
               : theme

     useEffect(() => {
          if (nodes.length > 0 && nodes.length !== prevNodeCount.current) {
               prevNodeCount.current = nodes.length
               setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
          }

          // Auch bei Layout-Direction Änderung neu layouten
          if (layoutDirection !== prevLayoutDir.current) {
               prevLayoutDir.current = layoutDirection
               setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
          }
     }, [nodes.length, layoutDirection, fitView])

     const onNodeContextMenu = useCallback(
          (event: React.MouseEvent, node: { id: string }) => {
               event.preventDefault()
               setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY })
          },
          []
     )

     const onNodeDoubleClick = useCallback(
          (_event: React.MouseEvent, node: { id: string }) => {
               setEditNodeId(node.id)
          },
          []
     )

     const onPaneClick = useCallback(() => {
          setContextMenu(null)
     }, [])

     return (
          <div className="h-full w-full relative">
               <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onNodeContextMenu={onNodeContextMenu}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onPaneClick={onPaneClick}
                    fitView
                    colorMode={colorMode}
                    deleteKeyCode="Delete"
                    multiSelectionKeyCode="Shift"
                    selectionOnDrag
                    selectNodesOnDrag
                    style={{ background: 'var(--canvas-bg)' }}
               >
                    <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--canvas-dot)" />
                    <Controls showInteractive={false} />
                    <MiniMap
                         nodeStrokeWidth={2}
                         pannable
                         zoomable
                    />
                    <Panel position="top-right">
                         <Toolbar />
                    </Panel>
               </ReactFlow>

               {/* Selection action bar */}
               {selectedNodeIds.length > 1 && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[var(--surface-2)]/80 backdrop-blur-xl rounded-full shadow-2xl border border-[var(--border)] px-4 py-2">
                         <span className="text-xs font-medium text-[var(--text-secondary)]">
                              {selectedNodeIds.length} selected
                         </span>
                         <div className="w-px h-4 bg-[var(--border)]" />
                         <button
                              onClick={() => duplicateNodes(selectedNodeIds)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--surface-3)] hover:bg-[var(--surface-3)]/80 rounded-full transition-colors"
                         >
                              <Copy size={12} />
                              Duplicate
                         </button>
                         <button
                              onClick={() => deleteNodes(selectedNodeIds)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--danger)] bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 rounded-full transition-colors"
                         >
                              <Trash2 size={12} />
                              Delete
                         </button>
                    </div>
               )}

               {/* Context menu */}
               {contextMenu && (
                    <NodeContextMenu
                         nodeId={contextMenu.nodeId}
                         x={contextMenu.x}
                         y={contextMenu.y}
                         onClose={() => setContextMenu(null)}
                         onEdit={(id) => setEditNodeId(id)}
                    />
               )}

               {/* Edit dialog */}
               {editNodeId && (
                    <NodeEditDialog nodeId={editNodeId} onClose={() => setEditNodeId(null)} />
               )}
          </div>
     )
}
