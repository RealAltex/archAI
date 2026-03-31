import { create } from 'zustand'
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import type { ArchitectureData } from '../types/architecture'
import type { FlowNodeData } from '../lib/flow-adapter'
import { archToFlow, flowToArch, normalizeArchitectureData } from '../lib/flow-adapter'
import { serializeMDSchema } from '../lib/md-schema/serializer'
import { getLayoutedElements, type LayoutDirection } from '../components/Canvas/layout'
import { nanoid } from 'nanoid'

const BASE_NODE_TYPES = new Set(['system', 'container', 'component', 'code'])

function mapLevelToNodeType(level: string): string {
     const normalized = level.trim().toLowerCase()
     return BASE_NODE_TYPES.has(normalized) ? normalized : 'component'
}

interface ProjectMeta {
     id: string
     name: string
     updatedAt: number
}

interface ArchitectureSnapshot {
     projectId: string | null
     title: string
     description: string
     nodes: Node<FlowNodeData>[]
     edges: Edge[]
     layoutDirection: LayoutDirection
     dirty: boolean
}

interface ArchitectureStore {
     // Data
     projectId: string | null
     title: string
     description: string
     nodes: Node<FlowNodeData>[]
     edges: Edge[]
     layoutDirection: LayoutDirection
     dirty: boolean

     // Actions
     setTitle: (title: string) => void
     setDescription: (description: string) => void
     setArchitectureData: (data: ArchitectureData) => void
     onNodesChange: OnNodesChange<Node<FlowNodeData>>
     onEdgesChange: OnEdgesChange
     onConnect: (connection: Connection) => void
     addNode: (label: string, level: string, parentId?: string) => void
     updateNode: (id: string, data: Partial<FlowNodeData>) => void
     deleteNode: (id: string) => void
     deleteNodes: (ids: string[]) => void
     duplicateNode: (id: string) => void
     duplicateNodes: (ids: string[]) => void
     applyLayout: (direction?: LayoutDirection) => void
     setLayoutDirection: (direction: LayoutDirection) => void
     getArchitectureData: () => ArchitectureData
     getMDContent: () => string
     saveProject: () => Promise<void>
     loadProject: (id: string) => Promise<void>
     listProjects: () => Promise<ProjectMeta[]>
     deleteProject: (id: string) => Promise<void>
     newProject: () => void
     reset: () => void
}

const ARCH_SNAPSHOT_KEY = 'archai:architecture-snapshot:v1'

function loadArchitectureSnapshot(): Partial<ArchitectureSnapshot> {
     if (typeof window === 'undefined') return {}

     try {
          const raw = window.localStorage.getItem(ARCH_SNAPSHOT_KEY)
          if (!raw) return {}

          const parsed = JSON.parse(raw) as Partial<ArchitectureSnapshot>
          return {
               projectId: typeof parsed.projectId === 'string' || parsed.projectId === null ? parsed.projectId : null,
               title: typeof parsed.title === 'string' ? parsed.title : 'Untitled Project',
               description: typeof parsed.description === 'string' ? parsed.description : '',
               nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
               edges: Array.isArray(parsed.edges) ? parsed.edges : [],
               layoutDirection:
                    parsed.layoutDirection === 'LR' ||
                    parsed.layoutDirection === 'RL' ||
                    parsed.layoutDirection === 'BT'
                         ? parsed.layoutDirection
                         : 'TB',
               dirty: Boolean(parsed.dirty)
          }
     } catch {
          return {}
     }
}

function persistArchitectureSnapshot(state: ArchitectureSnapshot): void {
     if (typeof window === 'undefined') return

     try {
          window.localStorage.setItem(
               ARCH_SNAPSHOT_KEY,
               JSON.stringify({
                    projectId: state.projectId,
                    title: state.title,
                    description: state.description,
                    nodes: state.nodes,
                    edges: state.edges,
                    layoutDirection: state.layoutDirection,
                    dirty: state.dirty
               })
          )
     } catch {
          // ignore persistence errors (quota/private mode)
     }
}

const initialSnapshot = loadArchitectureSnapshot()

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
     projectId: initialSnapshot.projectId ?? null,
     title: initialSnapshot.title ?? 'Untitled Project',
     description: initialSnapshot.description ?? '',
     nodes: initialSnapshot.nodes ?? [],
     edges: initialSnapshot.edges ?? [],
     layoutDirection: initialSnapshot.layoutDirection ?? 'TB',
     dirty: initialSnapshot.dirty ?? false,

     setTitle: (title) => set({ title, dirty: true }),

     setDescription: (description) => set({ description, dirty: true }),

     setArchitectureData: (data) => {
          const normalized = normalizeArchitectureData(data)
          const { nodes, edges } = archToFlow(normalized)
          const layouted = getLayoutedElements(nodes, edges, get().layoutDirection)
          set({
               title: normalized.title,
               description: normalized.description || '',
               nodes: layouted.nodes,
               edges: layouted.edges,
               dirty: true
          })
     },

     onNodesChange: (changes) => {
          const removedNodeIds = new Set<string>()
          for (const change of changes) {
               if (change.type === 'remove' && 'id' in change) {
                    removedNodeIds.add(change.id)
               }
          }

          const nextNodes = applyNodeChanges(changes, get().nodes)
          if (removedNodeIds.size === 0) {
               set({ nodes: nextNodes, dirty: true })
               return
          }

          const nextEdges = get().edges.filter(
               (edge) => !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target)
          )
          const layouted = getLayoutedElements(nextNodes, nextEdges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     onEdgesChange: (changes) => {
          const nextEdges = applyEdgeChanges(changes, get().edges)
          const structureChanged = changes.some((change) => change.type === 'remove')

          if (!structureChanged) {
               set({ edges: nextEdges, dirty: true })
               return
          }

          const layouted = getLayoutedElements(get().nodes, nextEdges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     onConnect: (connection) => {
          const nextEdges = addEdge(
               {
                    ...connection,
                    id: nanoid(),
                    type: 'smoothstep',
                    data: { isHierarchy: false, edgeStyle: 'solid' }
               },
               get().edges
          )

          const layouted = getLayoutedElements(get().nodes, nextEdges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     addNode: (label, level, parentId) => {
          const newNode: Node<FlowNodeData> = {
               id: nanoid(),
               type: mapLevelToNodeType(level),
               position: { x: 0, y: 0 },
               data: { label, level, description: '', technology: '', parentId }
          }

          const nextNodes = [...get().nodes, newNode]
          const layouted = getLayoutedElements(nextNodes, get().edges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     updateNode: (id, data) => {
          const nextNodes = get().nodes.map((node) => {
               if (node.id !== id) return node

               const nextLevel = typeof data.level === 'string' ? data.level : node.data.level
               return {
                    ...node,
                    type: mapLevelToNodeType(nextLevel || 'component'),
                    data: { ...node.data, ...data }
               }
          })

          const layouted = getLayoutedElements(nextNodes, get().edges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     deleteNode: (id) => {
          const nextNodes = get().nodes.filter((n) => n.id !== id && n.data.parentId !== id)
          const nextEdges = get().edges.filter((e) => e.source !== id && e.target !== id)
          const layouted = getLayoutedElements(nextNodes, nextEdges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     deleteNodes: (ids) => {
          const idSet = new Set(ids)
          const nextNodes = get().nodes.filter((n) => !idSet.has(n.id) && !idSet.has(n.data.parentId as string))
          const nextEdges = get().edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target))
          const layouted = getLayoutedElements(nextNodes, nextEdges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     duplicateNode: (id) => {
          const node = get().nodes.find((n) => n.id === id)
          if (!node) return
          const newNode: Node<FlowNodeData> = {
               ...node,
               id: nanoid(),
               position: { x: node.position.x, y: node.position.y },
               selected: false,
               data: { ...node.data }
          }

          const nextNodes = [...get().nodes, newNode]
          const layouted = getLayoutedElements(nextNodes, get().edges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     duplicateNodes: (ids) => {
          const idSet = new Set(ids)
          const newNodes: Node<FlowNodeData>[] = []
          for (const node of get().nodes) {
               if (idSet.has(node.id)) {
                    newNodes.push({
                         ...node,
                         id: nanoid(),
                         position: { x: node.position.x, y: node.position.y },
                         selected: false,
                         data: { ...node.data }
                    })
               }
          }

          const nextNodes = [...get().nodes, ...newNodes]
          const layouted = getLayoutedElements(nextNodes, get().edges, get().layoutDirection)
          set({ nodes: layouted.nodes, edges: layouted.edges, dirty: true })
     },

     applyLayout: (direction) => {
          const dir = direction || get().layoutDirection
          const { nodes, edges } = getLayoutedElements(get().nodes, get().edges, dir)
          set({ nodes, edges, layoutDirection: dir, dirty: true })
     },

     setLayoutDirection: (direction) => set({ layoutDirection: direction }),

     getArchitectureData: () => {
          return flowToArch(get().nodes, get().edges, get().title, get().description)
     },

     getMDContent: () => {
          const data = get().getArchitectureData()
          return serializeMDSchema(data)
     },

     saveProject: async () => {
          const { projectId, getArchitectureData, layoutDirection } = get()
          const id = projectId || nanoid()
          const data = {
               ...getArchitectureData(),
               layoutDirection,
               updatedAt: Date.now()
          }
          await window.electronAPI.projects.save(id, data)
          set({ projectId: id, dirty: false })
     },

     loadProject: async (id) => {
          const raw = (await window.electronAPI.projects.load(id)) as ArchitectureData & {
               layoutDirection?: LayoutDirection
          }
          const normalized = normalizeArchitectureData(raw)
          const { nodes, edges } = archToFlow(normalized)
          const dir = raw.layoutDirection || get().layoutDirection
          const layouted = getLayoutedElements(nodes, edges, dir)
          set({
               projectId: id,
               title: normalized.title,
               description: normalized.description || '',
               nodes: layouted.nodes,
               edges: layouted.edges,
               layoutDirection: dir,
               dirty: false
          })
     },

     listProjects: async () => {
          return window.electronAPI.projects.list()
     },

     deleteProject: async (id) => {
          await window.electronAPI.projects.delete(id)
          if (get().projectId === id) {
               get().newProject()
          }
     },

     newProject: () =>
          set({
               projectId: null,
               title: 'Untitled Project',
               description: '',
               nodes: [],
               edges: [],
               dirty: false
          }),

     reset: () =>
          set({
               projectId: null,
               title: 'Untitled Project',
               description: '',
               nodes: [],
               edges: [],
               dirty: false
          })
}))

useArchitectureStore.subscribe((state) => {
     persistArchitectureSnapshot({
          projectId: state.projectId,
          title: state.title,
          description: state.description,
          nodes: state.nodes,
          edges: state.edges,
          layoutDirection: state.layoutDirection,
          dirty: state.dirty
     })
})
