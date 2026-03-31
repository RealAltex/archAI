import type { Node, Edge } from '@xyflow/react'
import type { ArchitectureData, ArchNode, ArchEdge } from '../types/architecture'
import { nanoid } from 'nanoid'

export interface FlowNodeData {
     label: string
     level: string
     description?: string
     technology?: string
     tags?: string[]
     notes?: string
     parentId?: string
     [key: string]: unknown
}

export function archToFlow(data: ArchitectureData): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
     const nodes: Node<FlowNodeData>[] = data.nodes.map((node) => ({
          id: node.id,
          type: node.level,
          position: node.position || { x: 0, y: 0 },
          // Don't set parentId — React Flow renders children inside parent (sub-flows)
          // which causes overlap. Instead store parentId in data for layout purposes.
          data: {
               label: node.label,
               level: node.level,
               description: node.description,
               technology: node.technology,
               tags: node.tags,
               notes: node.notes,
               parentId: node.parentId
          }
     }))

     const edges: Edge[] = data.edges.map((edge) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
          label: edge.label,
          type: 'default',
          animated: edge.style === 'dashed',
          style: edge.style === 'dotted' ? { strokeDasharray: '2 2' } : undefined
     }))

     // Add implicit hierarchy edges for parent→child relationships
     for (const node of data.nodes) {
          if (node.parentId) {
               const hierarchyEdgeId = `hierarchy-${node.parentId}-${node.id}`
               // Only add if not already an explicit edge between them
               const exists = edges.some(
                    (e) => e.source === node.parentId && e.target === node.id
               )
               if (!exists) {
                    edges.push({
                         id: hierarchyEdgeId,
                         source: node.parentId,
                         target: node.id,
                         type: 'default',
                         style: { strokeDasharray: '5 5', opacity: 0.4 },
                         animated: false
                    })
               }
          }
     }

     return { nodes, edges }
}

export function flowToArch(
     nodes: Node<FlowNodeData>[],
     edges: Edge[],
     title: string,
     description?: string
): ArchitectureData {
     const archNodes: ArchNode[] = nodes.map((node) => ({
          id: node.id,
          label: node.data.label,
          level: node.data.level as ArchNode['level'],
          parentId: (node.data.parentId as string) || undefined,
          description: node.data.description,
          technology: node.data.technology,
          tags: node.data.tags,
          notes: node.data.notes,
          position: { x: node.position.x, y: node.position.y }
     }))

     const archEdges: ArchEdge[] = edges.map((edge) => ({
          id: edge.id || nanoid(),
          sourceId: edge.source,
          targetId: edge.target,
          label: typeof edge.label === 'string' ? edge.label : undefined
     }))

     return { title, description, nodes: archNodes, edges: archEdges }
}
