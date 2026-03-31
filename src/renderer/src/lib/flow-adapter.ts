import type { Node, Edge } from '@xyflow/react'
import {
     DEFAULT_NODE_LEVELS,
     type ArchitectureData,
     type ArchNode,
     type ArchEdge,
     type ArchNodeNotes
} from '../types/architecture'
import { nanoid } from 'nanoid'

export interface FlowNodeData {
     label: string
     level: string
     description?: string
     technology?: string
     tags?: string[]
     notes?: string
     noteBlocks?: ArchNodeNotes
     parentId?: string
     [key: string]: unknown
}

interface FlowEdgeData {
     isHierarchy?: boolean
     edgeStyle?: ArchEdge['style']
     [key: string]: unknown
}

const BASE_NODE_TYPES = ['system', 'container', 'component', 'code'] as const

const LEVEL_RANK = new Map<string, number>(DEFAULT_NODE_LEVELS.map((level, index) => [level, index]))

function normalizeNodeLevel(level: unknown): string {
     if (typeof level !== 'string') return 'component'
     const normalized = level.trim().toLowerCase()
     return normalized.length > 0 ? normalized : 'component'
}

function sanitizeString(value: unknown): string | undefined {
     if (typeof value !== 'string') return undefined
     const trimmed = value.trim()
     return trimmed.length > 0 ? trimmed : undefined
}

function normalizeStringList(value: unknown): string[] | undefined {
     if (!Array.isArray(value)) return undefined

     const unique = new Set<string>()
     const result: string[] = []

     for (const item of value) {
          if (typeof item !== 'string') continue
          const trimmed = item.trim()
          if (!trimmed) continue
          const key = trimmed.toLowerCase()
          if (unique.has(key)) continue
          unique.add(key)
          result.push(trimmed)
     }

     return result.length > 0 ? result : undefined
}

function normalizeNoteBlocks(value: unknown): ArchNodeNotes | undefined {
     if (!value || typeof value !== 'object') return undefined

     const raw = value as ArchNodeNotes
     const noteBlocks: ArchNodeNotes = {}

     const summary = sanitizeString(raw.summary)
     if (summary) noteBlocks.summary = summary

     const responsibilities = normalizeStringList(raw.responsibilities)
     if (responsibilities) noteBlocks.responsibilities = responsibilities

     const decisions = normalizeStringList(raw.decisions)
     if (decisions) noteBlocks.decisions = decisions

     const risks = normalizeStringList(raw.risks)
     if (risks) noteBlocks.risks = risks

     const nextSteps = normalizeStringList(raw.nextSteps)
     if (nextSteps) noteBlocks.nextSteps = nextSteps

     return Object.keys(noteBlocks).length > 0 ? noteBlocks : undefined
}

function makeUniqueId(preferred: string, usedIds: Set<string>, fallbackPrefix: string): string {
     const base = preferred.trim() || `${fallbackPrefix}-${nanoid(6)}`
     if (!usedIds.has(base)) {
          usedIds.add(base)
          return base
     }

     let attempt = 2
     while (usedIds.has(`${base}-${attempt}`)) {
          attempt += 1
     }

     const unique = `${base}-${attempt}`
     usedIds.add(unique)
     return unique
}

function hasParentCycle(nodeById: Map<string, ArchNode>, nodeId: string, parentId: string): boolean {
     const seen = new Set<string>([nodeId])
     let currentId: string | undefined = parentId

     while (currentId) {
          if (seen.has(currentId)) return true
          seen.add(currentId)
          currentId = nodeById.get(currentId)?.parentId
     }

     return false
}

function levelSortKey(level: string): [number, string] {
     const rank = LEVEL_RANK.get(level)
     if (typeof rank === 'number') return [0, `${rank.toString().padStart(3, '0')}`]
     return [1, level]
}

export function normalizeArchitectureData(data: ArchitectureData): ArchitectureData {
     const rawNodes = Array.isArray(data.nodes) ? data.nodes : []
     const rawEdges = Array.isArray(data.edges) ? data.edges : []

     const usedNodeIds = new Set<string>()
     const firstIdMapping = new Map<string, string>()

     const normalizedNodes: ArchNode[] = rawNodes
          .filter((node): node is ArchNode => Boolean(node && typeof node === 'object'))
          .map((node, index) => {
               const rawId = sanitizeString(node.id) || `node-${index + 1}`
               const id = makeUniqueId(rawId, usedNodeIds, 'node')
               if (!firstIdMapping.has(rawId)) {
                    firstIdMapping.set(rawId, id)
               }

               const label = sanitizeString(node.label) || `Node ${index + 1}`
               const level = normalizeNodeLevel(node.level)

               const position =
                    node.position &&
                    Number.isFinite(node.position.x) &&
                    Number.isFinite(node.position.y)
                         ? { x: node.position.x, y: node.position.y }
                         : undefined

               return {
                    id,
                    label,
                    level,
                    parentId: sanitizeString(node.parentId),
                    description: sanitizeString(node.description),
                    technology: sanitizeString(node.technology),
                    tags: normalizeStringList(node.tags),
                    notes: sanitizeString(node.notes),
                    noteBlocks: normalizeNoteBlocks(node.noteBlocks),
                    position
               }
          })

     const validNodeIds = new Set(normalizedNodes.map((node) => node.id))

     for (const node of normalizedNodes) {
          if (!node.parentId) continue

          const mappedParentId = firstIdMapping.get(node.parentId) || node.parentId
          node.parentId = validNodeIds.has(mappedParentId) && mappedParentId !== node.id
               ? mappedParentId
               : undefined
     }

     const nodeById = new Map(normalizedNodes.map((node) => [node.id, node]))
     for (const node of normalizedNodes) {
          if (!node.parentId) continue
          if (hasParentCycle(nodeById, node.id, node.parentId)) {
               node.parentId = undefined
          }
     }

     const usedEdgeIds = new Set<string>()
     const edgeKeySet = new Set<string>()

     const normalizedEdges: ArchEdge[] = []
     for (const rawEdge of rawEdges) {
          if (!rawEdge || typeof rawEdge !== 'object') continue

          const sourceRaw = sanitizeString(rawEdge.sourceId)
          const targetRaw = sanitizeString(rawEdge.targetId)
          if (!sourceRaw || !targetRaw) continue

          const sourceId = firstIdMapping.get(sourceRaw) || sourceRaw
          const targetId = firstIdMapping.get(targetRaw) || targetRaw

          if (!validNodeIds.has(sourceId) || !validNodeIds.has(targetId)) continue
          if (sourceId === targetId) continue

          const label = sanitizeString(rawEdge.label)
          const description = sanitizeString(rawEdge.description)
          const style: ArchEdge['style'] | undefined =
               rawEdge.style === 'solid' || rawEdge.style === 'dashed' || rawEdge.style === 'dotted'
                    ? rawEdge.style
                    : undefined

          const key = `${sourceId}|${targetId}|${(label || '').toLowerCase()}|${style || ''}`
          if (edgeKeySet.has(key)) continue
          edgeKeySet.add(key)

          const edgeId = makeUniqueId(sanitizeString(rawEdge.id) || `edge-${sourceId}-${targetId}`, usedEdgeIds, 'edge')
          normalizedEdges.push({
               id: edgeId,
               sourceId,
               targetId,
               label,
               description,
               style
          })
     }

     normalizedNodes.sort((a, b) => {
          const [aPrimary, aLevel] = levelSortKey(a.level)
          const [bPrimary, bLevel] = levelSortKey(b.level)

          if (aPrimary !== bPrimary) return aPrimary - bPrimary
          const levelCompare = aLevel.localeCompare(bLevel)
          if (levelCompare !== 0) return levelCompare

          const labelCompare = a.label.localeCompare(b.label)
          if (labelCompare !== 0) return labelCompare

          return a.id.localeCompare(b.id)
     })

     normalizedEdges.sort((a, b) => {
          const sourceCompare = a.sourceId.localeCompare(b.sourceId)
          if (sourceCompare !== 0) return sourceCompare

          const targetCompare = a.targetId.localeCompare(b.targetId)
          if (targetCompare !== 0) return targetCompare

          const labelCompare = (a.label || '').localeCompare(b.label || '')
          if (labelCompare !== 0) return labelCompare

          return a.id.localeCompare(b.id)
     })

     return {
          title: sanitizeString(data.title) || 'Untitled Project',
          description: sanitizeString(data.description),
          nodes: normalizedNodes,
          edges: normalizedEdges
     }
}

function mapLevelToNodeType(level: string): (typeof BASE_NODE_TYPES)[number] {
     const normalized = level.trim().toLowerCase()
     if (BASE_NODE_TYPES.includes(normalized as (typeof BASE_NODE_TYPES)[number])) {
          return normalized as (typeof BASE_NODE_TYPES)[number]
     }

     // Deterministic fallback so unknown/deeper levels still use existing visual styles.
     let hash = 0
     for (let i = 0; i < normalized.length; i++) {
          hash = (hash + normalized.charCodeAt(i)) % BASE_NODE_TYPES.length
     }

     return BASE_NODE_TYPES[hash]
}

export function archToFlow(data: ArchitectureData): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
     const normalized = normalizeArchitectureData(data)

     const nodes: Node<FlowNodeData>[] = normalized.nodes.map((node) => ({
          id: node.id,
          type: mapLevelToNodeType(node.level),
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
               noteBlocks: node.noteBlocks,
               parentId: node.parentId
          }
     }))

     const edges: Edge<FlowEdgeData>[] = normalized.edges.map((edge) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
          label: edge.label,
          type: 'smoothstep',
          animated: false,
          style:
               edge.style === 'dashed'
                    ? { strokeDasharray: '6 4' }
                    : edge.style === 'dotted'
                         ? { strokeDasharray: '2 4' }
                         : undefined,
          data: {
               isHierarchy: false,
               edgeStyle: edge.style
          }
     }))

     // Add implicit hierarchy edges for parent→child relationships
     for (const node of normalized.nodes) {
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
                         type: 'smoothstep',
                         style: { strokeDasharray: '5 5', opacity: 0.4 },
                         animated: false,
                         data: {
                              isHierarchy: true,
                              edgeStyle: 'dashed'
                         }
                    })
               }
          }
     }

     return { nodes, edges: edges as Edge[] }
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
          level: (node.data.level || node.type || 'component') as ArchNode['level'],
          parentId: (node.data.parentId as string) || undefined,
          description: node.data.description,
          technology: node.data.technology,
          tags: node.data.tags,
          notes: node.data.notes,
          noteBlocks: node.data.noteBlocks as ArchNodeNotes | undefined,
          position: { x: node.position.x, y: node.position.y }
     }))

     const archEdges: ArchEdge[] = edges
          .filter((edge) => {
               const edgeData = (edge.data || {}) as FlowEdgeData
               return !edgeData.isHierarchy && !edge.id.startsWith('hierarchy-')
          })
          .map((edge) => {
               const strokeDasharray = typeof edge.style?.strokeDasharray === 'string'
                    ? edge.style.strokeDasharray
                    : undefined

               let style: ArchEdge['style'] | undefined
               if (strokeDasharray === '6 4' || strokeDasharray === '5 5') {
                    style = 'dashed'
               } else if (strokeDasharray === '2 4' || strokeDasharray === '2 2') {
                    style = 'dotted'
               } else {
                    style = ((edge.data as FlowEdgeData | undefined)?.edgeStyle as ArchEdge['style'] | undefined) || 'solid'
               }

               return {
                    id: edge.id || nanoid(),
                    sourceId: edge.source,
                    targetId: edge.target,
                    label: typeof edge.label === 'string' ? edge.label : undefined,
                    style
               }
          })

     return normalizeArchitectureData({ title, description, nodes: archNodes, edges: archEdges })
}
