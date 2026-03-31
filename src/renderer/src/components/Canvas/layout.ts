import type { Node, Edge } from '@xyflow/react'
import * as dagre from '@dagrejs/dagre'
import type { FlowNodeData } from '../../lib/flow-adapter'

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
     system: { width: 280, height: 100 },
     container: { width: 240, height: 80 },
     component: { width: 200, height: 60 },
     code: { width: 160, height: 50 }
}

export type LayoutDirection = 'TB' | 'LR'

export function getLayoutedElements(
     nodes: Node<FlowNodeData>[],
     edges: Edge[],
     direction: LayoutDirection = 'TB'
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
     if (nodes.length === 0) return { nodes, edges }

     const g = new dagre.graphlib.Graph()
     g.setDefaultEdgeLabel(() => ({}))
     g.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50, marginx: 40, marginy: 40 })

     // Layout ALL nodes (no sub-flow grouping)
     for (const node of nodes) {
          const dims = NODE_DIMENSIONS[node.data.level] || NODE_DIMENSIONS.component
          g.setNode(node.id, { width: dims.width, height: dims.height })
     }

     for (const edge of edges) {
          if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
               g.setEdge(edge.source, edge.target)
          }
     }

     dagre.layout(g)

     const layoutedNodes: Node<FlowNodeData>[] = nodes.map((node) => {
          const pos = g.node(node.id)
          const dims = NODE_DIMENSIONS[node.data.level] || NODE_DIMENSIONS.component
          return {
               ...node,
               position: {
                    x: pos.x - dims.width / 2,
                    y: pos.y - dims.height / 2
               }
          }
     })

     return { nodes: layoutedNodes, edges }
}
