import type { Node, Edge } from '@xyflow/react'
import * as dagre from '@dagrejs/dagre'
import type { FlowNodeData } from '../../lib/flow-adapter'

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
     system: { width: 320, height: 120 },
     container: { width: 280, height: 100 },
     component: { width: 240, height: 80 },
     code: { width: 200, height: 60 }
}

export type LayoutDirection = 'TB' | 'LR' | 'RL' | 'BT'

/**
 * Intelligente Abstands-Berechnung basierend auf Projekt-Größe
 * Kleine Projekte brauchen mehr Platz, große Projekte können dichter sein
 */
function getLayoutConfig(nodeCount: number, direction: LayoutDirection): { ranksep: number; nodesep: number; acyclicer: string; rankSep: number } {
     let ranksep = 140
     let nodesep = 80

     // Adaptive Abstände
     if (nodeCount < 5) {
          ranksep = 180
          nodesep = 120
     } else if (nodeCount < 10) {
          ranksep = 160
          nodesep = 100
     } else if (nodeCount < 20) {
          ranksep = 140
          nodesep = 80
     } else {
          ranksep = 120
          nodesep = 60
     }

     // Horizontale Layouts brauchen mehr horizontalen Platz
     if (direction === 'LR' || direction === 'RL') {
          ranksep = Math.ceil(ranksep * 1.2)
          nodesep = Math.ceil(nodesep * 0.9)
     }

     return {
          ranksep,
          nodesep,
          acyclicer: 'greedy', // Verhindert Überlappungen bei zirkulären Abhängigkeiten
          rankSep: ranksep
     }
}

/**
 * Analysiert die Hierarchie-Struktur der Nodes
 * Wird später genutzt für intelligente Layout-Auswahl
 */
/*
function analyzeHierarchy(nodes: Node<FlowNodeData>[]): { depth: number; maxWidth: number; levelDistribution: Record<string, number> } {
     const levels: Record<string, number> = {}

     for (const node of nodes) {
          const level = node.data.level || 'component'
          levels[level] = (levels[level] || 0) + 1
     }

     const depth = Object.keys(levels).length
     const maxWidth = Math.max(...Object.values(levels))

     return {
          depth,
          maxWidth,
          levelDistribution: levels
     }
}
*/

export function getLayoutedElements(
     nodes: Node<FlowNodeData>[],
     edges: Edge[],
     direction: LayoutDirection = 'TB'
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
     if (nodes.length === 0) return { nodes, edges }

     const config = getLayoutConfig(nodes.length, direction)
     // Hierarchie-Analyse für zukünftige erweiterte Layouts
     // const hierarchy = analyzeHierarchy(nodes)

     const g = new dagre.graphlib.Graph()
     g.setDefaultEdgeLabel(() => ({}))
     g.setGraph({
          rankdir: direction,
          ranksep: config.ranksep,
          nodesep: config.nodesep,
          marginx: 60,
          marginy: 60,
          acyclicer: config.acyclicer,
          compound: true // Erlaubt verschachtelte Gruppen
     })

     // Layout ALL nodes
     for (const node of nodes) {
          const dims = NODE_DIMENSIONS[node.data.level] || NODE_DIMENSIONS.component
          g.setNode(node.id, {
               width: dims.width,
               height: dims.height,
               label: node.data.label
          })
     }

     // Kanten: Normale Kanten und Parent-Kind-Beziehungen
     for (const edge of edges) {
          if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
               const edgeLabel = typeof (edge.data as any)?.label === 'string' ? (edge.data as any).label : undefined
               g.setEdge(edge.source, edge.target, {
                    label: edgeLabel,
                    weight: (edge.data as any)?.style === 'dashed' ? 0.5 : 1 // Hierarchie-Kanten weniger Gewicht
               })
          }
     }

     dagre.layout(g)

     const layoutedNodes: Node<FlowNodeData>[] = nodes.map((node) => {
          const pos = g.node(node.id)
          if (!pos) return node // Sicherheit: Falls Knoten nicht gelayoutet wurde

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
