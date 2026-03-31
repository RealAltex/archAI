import type { Node, Edge } from '@xyflow/react'
import * as dagre from '@dagrejs/dagre'
import type { FlowNodeData } from '../../lib/flow-adapter'

type NodeDimensionPreset = {
     minWidth: number
     maxWidth: number
     baseHeight: number
     charWidth: number
}

type NodeDimensions = {
     width: number
     height: number
}

const NODE_DIMENSION_PRESETS: Record<string, NodeDimensionPreset> = {
     system: { minWidth: 320, maxWidth: 440, baseHeight: 90, charWidth: 7.1 },
     container: { minWidth: 280, maxWidth: 400, baseHeight: 82, charWidth: 6.9 },
     component: { minWidth: 240, maxWidth: 360, baseHeight: 64, charWidth: 6.7 },
     code: { minWidth: 200, maxWidth: 300, baseHeight: 50, charWidth: 6.6 }
}

export type LayoutDirection = 'TB' | 'LR' | 'RL' | 'BT'

function clamp(value: number, min: number, max: number): number {
     return Math.min(max, Math.max(min, value))
}

function getPrimaryNote(data: FlowNodeData): string {
     const summary = data.noteBlocks?.summary?.trim()
     if (summary) return summary
     const notes = data.notes?.trim()
     return notes || ''
}

function estimateTextLines(text: string | undefined, contentWidth: number, charWidth: number): number {
     if (!text) return 0
     const normalized = text.trim()
     if (!normalized) return 0

     const charsPerLine = Math.max(18, Math.floor(contentWidth / charWidth))
     const lines = Math.ceil(normalized.length / charsPerLine)
     return Math.max(1, lines)
}

export function estimateNodeDimensions(node: Node<FlowNodeData>): NodeDimensions {
     const preset = NODE_DIMENSION_PRESETS[node.type as string] || NODE_DIMENSION_PRESETS.component

     const label = (node.data.label || '').trim()
     const technology = (node.data.technology || '').trim()
     const description = (node.data.description || '').trim()
     const note = getPrimaryNote(node.data)

     const longestToken = Math.max(
          ...[label, technology, description, note]
               .flatMap((value) => value.split(/\s+/))
               .map((token) => token.length),
          0
     )

     const contentDrivenWidth = Math.max(
          preset.minWidth,
          label.length * 8 + 92,
          technology.length > 0 ? technology.length * 7 + 104 : 0,
          longestToken > 0 ? longestToken * 6.5 + 90 : 0
     )

     const width = Math.round(clamp(contentDrivenWidth, preset.minWidth, preset.maxWidth))
     const textWidth = width - 48

     const descriptionLines = estimateTextLines(description, textWidth, preset.charWidth)
     const noteLines = estimateTextLines(note, textWidth, preset.charWidth)

     let height = preset.baseHeight

     if (technology) {
          height += 24
     }

     if (descriptionLines > 0) {
          height += descriptionLines * 15 + 6
     }

     if (noteLines > 0) {
          height += noteLines * 15 + 10
     }

     return {
          width,
          height: Math.round(clamp(height, preset.baseHeight, 320))
     }
}

/**
 * Intelligente Abstands-Berechnung basierend auf Projekt-Größe
 * Kleine Projekte brauchen mehr Platz, große Projekte können dichter sein
 */
function getLayoutConfig(
     nodeCount: number,
     direction: LayoutDirection
): { ranksep: number; nodesep: number; acyclicer: string; minimumGap: number } {
     let ranksep = 140
     let nodesep = 80
     let minimumGap = 26

     // Adaptive Abstände
     if (nodeCount < 5) {
          ranksep = 180
          nodesep = 120
          minimumGap = 34
     } else if (nodeCount < 10) {
          ranksep = 160
          nodesep = 100
          minimumGap = 30
     } else if (nodeCount < 20) {
          ranksep = 140
          nodesep = 80
          minimumGap = 26
     } else {
          ranksep = 120
          nodesep = 60
          minimumGap = 22
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
          minimumGap
     }
}

function getNodeBounds(node: Node<FlowNodeData>, dimensions: NodeDimensions): {
     left: number
     right: number
     top: number
     bottom: number
     centerX: number
     centerY: number
} {
     const left = node.position.x
     const top = node.position.y
     const right = left + dimensions.width
     const bottom = top + dimensions.height

     return {
          left,
          right,
          top,
          bottom,
          centerX: left + dimensions.width / 2,
          centerY: top + dimensions.height / 2
     }
}

function resolveCollisions(
     nodes: Node<FlowNodeData>[],
     dimensionsById: Map<string, NodeDimensions>,
     direction: LayoutDirection,
     minimumGap: number
): Node<FlowNodeData>[] {
     const result = nodes.map((node) => ({
          ...node,
          position: { ...node.position }
     }))

     const preferHorizontalSpread = direction === 'TB' || direction === 'BT'
     const maxIterations = 140

     for (let iteration = 0; iteration < maxIterations; iteration += 1) {
          let changed = false

          for (let i = 0; i < result.length; i += 1) {
               for (let j = i + 1; j < result.length; j += 1) {
                    const a = result[i]
                    const b = result[j]
                    const aDims = dimensionsById.get(a.id) || estimateNodeDimensions(a)
                    const bDims = dimensionsById.get(b.id) || estimateNodeDimensions(b)

                    const aBounds = getNodeBounds(a, aDims)
                    const bBounds = getNodeBounds(b, bDims)

                    const overlapX =
                         Math.min(aBounds.right + minimumGap / 2, bBounds.right + minimumGap / 2) -
                         Math.max(aBounds.left - minimumGap / 2, bBounds.left - minimumGap / 2)
                    const overlapY =
                         Math.min(aBounds.bottom + minimumGap / 2, bBounds.bottom + minimumGap / 2) -
                         Math.max(aBounds.top - minimumGap / 2, bBounds.top - minimumGap / 2)

                    if (overlapX <= 0 || overlapY <= 0) continue

                    const separateOnX =
                         preferHorizontalSpread
                              ? overlapX <= overlapY * 1.15
                              : overlapX <= overlapY * 0.85

                    if (separateOnX) {
                         const delta = overlapX / 2 + 1
                         const splitByOrder = aBounds.centerX === bBounds.centerX
                              ? a.id.localeCompare(b.id) <= 0
                              : aBounds.centerX < bBounds.centerX

                         if (splitByOrder) {
                              a.position.x -= delta
                              b.position.x += delta
                         } else {
                              a.position.x += delta
                              b.position.x -= delta
                         }
                    } else {
                         const delta = overlapY / 2 + 1
                         const splitByOrder = aBounds.centerY === bBounds.centerY
                              ? a.id.localeCompare(b.id) <= 0
                              : aBounds.centerY < bBounds.centerY

                         if (splitByOrder) {
                              a.position.y -= delta
                              b.position.y += delta
                         } else {
                              a.position.y += delta
                              b.position.y -= delta
                         }
                    }

                    changed = true
               }
          }

          if (!changed) break
     }

     return result
}

function centerGraph(nodes: Node<FlowNodeData>[], dimensionsById: Map<string, NodeDimensions>): Node<FlowNodeData>[] {
     if (nodes.length === 0) return nodes

     let minX = Number.POSITIVE_INFINITY
     let minY = Number.POSITIVE_INFINITY
     let maxX = Number.NEGATIVE_INFINITY
     let maxY = Number.NEGATIVE_INFINITY

     for (const node of nodes) {
          const dims = dimensionsById.get(node.id) || estimateNodeDimensions(node)
          minX = Math.min(minX, node.position.x)
          minY = Math.min(minY, node.position.y)
          maxX = Math.max(maxX, node.position.x + dims.width)
          maxY = Math.max(maxY, node.position.y + dims.height)
     }

     const centerX = (minX + maxX) / 2
     const centerY = (minY + maxY) / 2

     return nodes.map((node) => ({
          ...node,
          position: {
               x: Math.round(node.position.x - centerX),
               y: Math.round(node.position.y - centerY)
          }
     }))
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

     const dimensionsById = new Map<string, NodeDimensions>()
     for (const node of nodes) {
          dimensionsById.set(node.id, estimateNodeDimensions(node))
     }

     const g = new dagre.graphlib.Graph()
     g.setDefaultEdgeLabel(() => ({}))
     g.setGraph({
          rankdir: direction,
          ranksep: config.ranksep,
          nodesep: config.nodesep,
          marginx: 90,
          marginy: 90,
          acyclicer: config.acyclicer,
          compound: true // Erlaubt verschachtelte Gruppen
     })

     // Layout ALL nodes
     for (const node of nodes) {
          const dims = dimensionsById.get(node.id) || estimateNodeDimensions(node)
          g.setNode(node.id, {
               width: dims.width,
               height: dims.height,
               label: node.data.label
          })
     }

     // Kanten: Normale Kanten und Parent-Kind-Beziehungen
     for (const edge of edges) {
          if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
               const edgeLabel = typeof edge.label === 'string' ? edge.label : undefined

               const isHierarchy =
                    (edge.data as { isHierarchy?: boolean } | undefined)?.isHierarchy === true ||
                    edge.id.startsWith('hierarchy-')

               g.setEdge(edge.source, edge.target, {
                    label: edgeLabel,
                    weight: isHierarchy ? 0.45 : 2,
                    minlen: isHierarchy ? 1 : 2
               })
          }
     }

     dagre.layout(g)

     const dagreLayoutNodes: Node<FlowNodeData>[] = nodes.map((node) => {
          const pos = g.node(node.id)
          if (!pos) return node // Sicherheit: Falls Knoten nicht gelayoutet wurde

          const dims = dimensionsById.get(node.id) || estimateNodeDimensions(node)
          return {
               ...node,
               position: {
                    x: pos.x - dims.width / 2,
                    y: pos.y - dims.height / 2
               }
          }
     })

     const deconflictedNodes = resolveCollisions(dagreLayoutNodes, dimensionsById, direction, config.minimumGap)
     const centeredNodes = centerGraph(deconflictedNodes, dimensionsById)

     return { nodes: centeredNodes, edges }
}
