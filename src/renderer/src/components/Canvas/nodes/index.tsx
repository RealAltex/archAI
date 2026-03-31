import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Server, Box, Puzzle, Code2 } from 'lucide-react'
import type { FlowNodeData } from '../../../lib/flow-adapter'

const levelConfig = {
     system: { label: 'System', icon: Server, color: 'var(--node-system)' },
     container: { label: 'Service', icon: Box, color: 'var(--node-container)' },
     component: { label: 'Module', icon: Puzzle, color: 'var(--node-component)' },
     code: { label: 'Code', icon: Code2, color: 'var(--node-code)' }
} as const

function formatLevelLabel(level: unknown, fallback: string): string {
     if (typeof level !== 'string' || level.trim().length === 0) return fallback

     return level
          .trim()
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
}

function getPrimaryNote(data: FlowNodeData): string {
     const summary = data.noteBlocks?.summary?.trim()
     if (summary) return summary
     const notes = data.notes?.trim()
     return notes || ''
}

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
     const primaryNote = getPrimaryNote(d)
     return (
          <div
               className="w-[320px] rounded-xl shadow-lg transition-shadow"
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
                         <span className="font-semibold text-sm break-words">{d.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium opacity-70 text-white">{formatLevelLabel(d.level, cfg.label)}</span>
               </div>
               <div className="px-4 py-3 space-y-2">
                    {d.technology && <TechBadge tech={d.technology} color={cfg.color} />}
                    {d.description && (
                         <p className="text-xs leading-relaxed break-words" style={{ color: 'var(--text-secondary)' }}>{d.description}</p>
                    )}
                    {primaryNote && (
                         <p className="text-[11px] leading-relaxed break-words" style={{ color: 'var(--text-secondary)' }}>
                              <span className="font-medium">Notes:</span> {primaryNote}
                         </p>
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
     const primaryNote = getPrimaryNote(d)
     return (
          <div
               className="w-[280px] rounded-xl shadow-md transition-shadow"
               style={{
                    background: 'var(--surface-1)',
                    border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                    boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${cfg.color} 20%, transparent)` : undefined
               }}
          >
               <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                         <Box size={13} strokeWidth={2} style={{ color: cfg.color }} />
                         <span className="font-semibold text-sm break-words" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: cfg.color }}>{formatLevelLabel(d.level, cfg.label)}</span>
               </div>
               <div className="px-4 py-2.5 space-y-2">
                    {d.technology && <TechBadge tech={d.technology} color={cfg.color} />}
                    {d.description && (
                         <p className="text-xs leading-relaxed break-words" style={{ color: 'var(--text-secondary)' }}>{d.description}</p>
                    )}
                    {primaryNote && (
                         <p className="text-[11px] leading-relaxed break-words" style={{ color: 'var(--text-secondary)' }}>
                              <span className="font-medium">Notes:</span> {primaryNote}
                         </p>
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
     const primaryNote = getPrimaryNote(d)
     return (
          <div
               className="w-[240px] rounded-lg shadow-sm transition-shadow"
               style={{
                    background: 'var(--surface-1)',
                    border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                    boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${cfg.color} 20%, transparent)` : undefined
               }}
          >
               <div className="px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Puzzle size={12} strokeWidth={2} style={{ color: cfg.color }} />
                         <span className="font-medium text-sm break-words" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: cfg.color }}>{formatLevelLabel(d.level, cfg.label)}</span>
               </div>
               {(d.technology || d.description || primaryNote) && (
                    <div className="px-3 pb-2 pl-7 space-y-1">
                         {d.technology && <TechBadge tech={d.technology} color={cfg.color} />}
                         {d.description && (
                              <p className="text-xs break-words" style={{ color: 'var(--text-secondary)' }}>{d.description}</p>
                         )}
                         {primaryNote && (
                              <p className="text-[11px] break-words" style={{ color: 'var(--text-secondary)' }}>
                                   <span className="font-medium">Notes:</span> {primaryNote}
                              </p>
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
     const primaryNote = getPrimaryNote(d)
     return (
          <div
               className="w-[200px] rounded-md px-3 py-2 transition-shadow"
               style={{
                    background: 'var(--surface-2)',
                    border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                    boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${cfg.color} 20%, transparent)` : undefined
               }}
          >
               <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                         <Code2 size={11} strokeWidth={2} style={{ color: cfg.color }} />
                         <span className="font-mono text-xs break-words" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: cfg.color }}>{formatLevelLabel(d.level, cfg.label)}</span>
               </div>
               {primaryNote && (
                    <p className="mt-1 text-[11px] break-words" style={{ color: 'var(--text-secondary)' }}>
                         <span className="font-medium">Notes:</span> {primaryNote}
                    </p>
               )}
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
