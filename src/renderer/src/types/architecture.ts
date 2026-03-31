export const DEFAULT_NODE_LEVELS = ['system', 'container', 'component', 'code'] as const
export type DefaultNodeLevel = (typeof DEFAULT_NODE_LEVELS)[number]

// Open level model: allows arbitrary/deeper levels beyond the default 4.
export type NodeLevel = string

export interface ArchNodeNotes {
     summary?: string
     responsibilities?: string[]
     decisions?: string[]
     risks?: string[]
     nextSteps?: string[]
}

export interface ArchNode {
     id: string
     label: string
     level: NodeLevel
     parentId?: string
     description?: string
     technology?: string
     tags?: string[]
     notes?: string
     noteBlocks?: ArchNodeNotes
     position?: { x: number; y: number }
}

export interface ArchEdge {
     id: string
     sourceId: string
     targetId: string
     label?: string
     description?: string
     style?: 'solid' | 'dashed' | 'dotted'
}

export interface ArchitectureData {
     title: string
     description?: string
     nodes: ArchNode[]
     edges: ArchEdge[]
}
