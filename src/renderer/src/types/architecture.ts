export type NodeLevel = 'system' | 'container' | 'component' | 'code'

export interface ArchNode {
     id: string
     label: string
     level: NodeLevel
     parentId?: string
     description?: string
     technology?: string
     tags?: string[]
     notes?: string
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
