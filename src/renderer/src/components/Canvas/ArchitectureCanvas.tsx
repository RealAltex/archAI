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
import { useEffect, useRef } from 'react'
import { useArchitectureStore } from '../../store/architecture-store'
import { useSettingsStore } from '../../store/settings-store'
import { nodeTypes } from './nodes'
import { Toolbar } from './Toolbar'

export function ArchitectureCanvas() {
     const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useArchitectureStore()
     const theme = useSettingsStore((s) => s.theme)
     const { fitView } = useReactFlow()
     const prevNodeCount = useRef(nodes.length)

     const colorMode = theme === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme

     // Auto fitView when nodes change significantly (e.g. LLM updates architecture)
     useEffect(() => {
          if (nodes.length > 0 && nodes.length !== prevNodeCount.current) {
               prevNodeCount.current = nodes.length
               // Small delay to let React Flow measure node dimensions
               setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
          }
     }, [nodes.length, fitView])

     return (
          <div className="h-full w-full">
               <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    colorMode={colorMode}
                    deleteKeyCode="Delete"
                    className="bg-gray-50 dark:bg-gray-950"
               >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                    <Controls />
                    <MiniMap
                         nodeStrokeWidth={3}
                         className="!bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700"
                    />
                    <Panel position="top-right">
                         <Toolbar />
                    </Panel>
               </ReactFlow>
          </div>
     )
}
