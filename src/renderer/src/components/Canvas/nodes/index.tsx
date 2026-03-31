import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FlowNodeData } from '../../../lib/flow-adapter'

export function SystemNode({ data }: NodeProps) {
     const d = data as FlowNodeData
     return (
          <div className="min-w-[260px] rounded-lg border-2 border-blue-500 bg-blue-50 shadow-md dark:bg-blue-950 dark:border-blue-400">
               <div className="bg-blue-500 dark:bg-blue-600 px-4 py-2 rounded-t-md">
                    <div className="text-white font-bold text-sm">{d.label}</div>
               </div>
               <div className="px-4 py-3">
                    {d.technology && (
                         <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded mb-1">
                              {d.technology}
                         </span>
                    )}
                    {d.description && (
                         <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{d.description}</p>
                    )}
               </div>
               <Handle type="target" position={Position.Top} className="!bg-blue-500" />
               <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
          </div>
     )
}

export function ContainerNode({ data }: NodeProps) {
     const d = data as FlowNodeData
     return (
          <div className="min-w-[220px] rounded-lg border-2 border-green-500 bg-green-50 shadow-sm dark:bg-green-950 dark:border-green-400">
               <div className="px-3 py-2">
                    <div className="font-semibold text-sm text-green-800 dark:text-green-200">{d.label}</div>
                    {d.technology && (
                         <span className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded mt-1">
                              {d.technology}
                         </span>
                    )}
                    {d.description && (
                         <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{d.description}</p>
                    )}
               </div>
               <Handle type="target" position={Position.Top} className="!bg-green-500" />
               <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
          </div>
     )
}

export function ComponentNode({ data }: NodeProps) {
     const d = data as FlowNodeData
     return (
          <div className="min-w-[180px] rounded-md border border-purple-400 bg-purple-50 shadow-sm dark:bg-purple-950 dark:border-purple-500 px-3 py-2">
               <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="font-medium text-sm text-purple-800 dark:text-purple-200">{d.label}</span>
               </div>
               {d.technology && (
                    <span className="text-xs text-purple-600 dark:text-purple-400">{d.technology}</span>
               )}
               <Handle type="target" position={Position.Top} className="!bg-purple-500" />
               <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
          </div>
     )
}

export function CodeNode({ data }: NodeProps) {
     const d = data as FlowNodeData
     return (
          <div className="min-w-[140px] rounded border border-gray-400 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 px-2 py-1.5">
               <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{d.label}</span>
               <Handle type="target" position={Position.Top} className="!bg-gray-500" />
               <Handle type="source" position={Position.Bottom} className="!bg-gray-500" />
          </div>
     )
}

export const nodeTypes = {
     system: SystemNode,
     container: ContainerNode,
     component: ComponentNode,
     code: CodeNode
}
