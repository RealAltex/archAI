import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Server, Box, Puzzle, Code2 } from 'lucide-react'
import type { FlowNodeData } from '../../../lib/flow-adapter'

const levelConfig = {
     system: { label: 'System', icon: Server, color: 'var(--node-system)' },
     container: { label: 'Service', icon: Box, color: 'var(--node-container)' },
     component: { label: 'Module', icon: Puzzle, color: 'var(--node-component)' },
     code: { label: 'Code', icon: Code2, color: 'var(--node-code)' }
} as const

function TechBadge({ tech, color }: { tech: string; color: string }) {
     return (
          <span
               className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md"
               style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
          >
               {tech}
          </span>
     )
}

function NodeHandle({ type, position, color }: { type: 'target' | 'source'; position: Position; color: string }) {
     return (
          <Handle
               type={type}
               position={position}
               className="!w-2 !h-2 !border-[1.5px] !rounded-full"
               style={{ background: color, borderColor: 'var(--surface-1)' }}
          />
     )
}

export function SystemNode({ data, selected }: NodeProps) {
     const d = data as FlowNodeData
     const cfg = levelConfig.system
     return (
          <div
               className="min-w-[280px] rounded-xl shadow-lg transition-shadow"
               style={{
                    background: 'var(--surface-1)',
                    border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                    boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${cfg.color} 20%, transparent)` : undefined
               }}
          >
               <div
                    className="px-4 py-2.5 rounded-t-[10px] flex items-center justify-between"
                    style={{ background: `linear-gradient(135deg, ${cfg.color}, color-mix(in srgb, ${cfg.color} 80%, #000))` }}
               >
                    <div className="flex items-center gap-2 text-white">
                         <Server size={14} strokeWidth={2} />
                         <span className="font-semibold text-sm">{d.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium opacity-70 text-white">{cfg.label}</span>
               </div>
               <div className="px-4 py-3 space-y-2">
                    {d.technology && <TechBadge tech={d.technology} color={cfg.color} />}
                    {d.description && (
                         <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{d.description}</p>
                    )}
               </div>
               <NodeHandle type="target" position={Position.Top} color={cfg.color} />
               <NodeHandle type="source" position={Position.Bottom} color={cfg.color} />
          </div>
     )
}

export function ContainerNode({ data, selected }: NodeProps) {
     const d = data as FlowNodeData
     const cfg = levelConfig.container
     return (
          <div
               className="min-w-[240px] rounded-xl shadow-md transition-shadow"
               style={{
                    background: 'var(--surface-1)',
                    border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                    boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${cfg.color} 20%, transparent)` : undefined
               }}
          >
               <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                         <Box size={13} strokeWidth={2} style={{ color: cfg.color }} />
                         <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
               </div>
               <div className="px-4 py-2.5 space-y-2">
                    {d.technology && <TechBadge tech={d.technology} color={cfg.color} />}
                    {d.description && (
                         <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{d.description}</p>
                    )}
               </div>
               <NodeHandle type="target" position={Position.Top} color={cfg.color} />
               <NodeHandle type="source" position={Position.Bottom} color={cfg.color} />
          </div>
     )
}

export function ComponentNode({ data, selected }: NodeProps) {
     const d = data as FlowNodeData
     const cfg = levelConfig.component
     return (
          <div
               className="min-w-[200px] rounded-lg shadow-sm transition-shadow"
               style={{
                    background: 'var(--surface-1)',
                    border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                    boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${cfg.color} 20%, transparent)` : undefined
               }}
          >
               <div className="px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Puzzle size={12} strokeWidth={2} style={{ color: cfg.color }} />
                         <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
               </div>
               {(d.technology || d.description) && (
                    <div className="px-3 pb-2 pl-7 space-y-1">
                         {d.technology && <TechBadge tech={d.technology} color={cfg.color} />}
                         {d.description && (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.description}</p>
                         )}
                    </div>
               )}
               <NodeHandle type="target" position={Position.Top} color={cfg.color} />
               <NodeHandle type="source" position={Position.Bottom} color={cfg.color} />
          </div>
     )
}

export function CodeNode({ data, selected }: NodeProps) {
     const d = data as FlowNodeData
     const cfg = levelConfig.code
     return (
          <div
               className="min-w-[160px] rounded-md px-3 py-2 transition-shadow"
               style={{
                    background: 'var(--surface-2)',
                    border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                    boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${cfg.color} 20%, transparent)` : undefined
               }}
          >
               <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                         <Code2 size={11} strokeWidth={2} style={{ color: cfg.color }} />
                         <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
               </div>
               <NodeHandle type="target" position={Position.Top} color={cfg.color} />
               <NodeHandle type="source" position={Position.Bottom} color={cfg.color} />
          </div>
     )
}

export const nodeTypes = {
     system: SystemNode,
     container: ContainerNode,
     component: ComponentNode,
     code: CodeNode
}
