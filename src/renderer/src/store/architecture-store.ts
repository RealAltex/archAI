import { create } from 'zustand'
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import type { ArchitectureData } from '../types/architecture'
import type { FlowNodeData } from '../lib/flow-adapter'
import { archToFlow, flowToArch } from '../lib/flow-adapter'
import { serializeMDSchema } from '../lib/md-schema/serializer'
import { getLayoutedElements, type LayoutDirection } from '../components/Canvas/layout'
import { nanoid } from 'nanoid'

interface ProjectMeta {
     id: string
     name: string
     updatedAt: number
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

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
     projectId: null,
     title: 'Untitled Project',
     description: '',
     nodes: [],
     edges: [],
     layoutDirection: 'TB',
     dirty: false,

     setTitle: (title) => set({ title, dirty: true }),

     setDescription: (description) => set({ description, dirty: true }),

     setArchitectureData: (data) => {
          const { nodes, edges } = archToFlow(data)
          const layouted = getLayoutedElements(nodes, edges, get().layoutDirection)
          set({
               title: data.title,
               description: data.description || '',
               nodes: layouted.nodes,
               edges: layouted.edges,
               dirty: true
          })
     },

     onNodesChange: (changes) => {
          set({ nodes: applyNodeChanges(changes, get().nodes), dirty: true })
     },

     onEdgesChange: (changes) => {
          set({ edges: applyEdgeChanges(changes, get().edges), dirty: true })
     },

     onConnect: (connection) => {
          set({ edges: addEdge({ ...connection, id: nanoid() }, get().edges), dirty: true })
     },

     addNode: (label, level, parentId) => {
          const newNode: Node<FlowNodeData> = {
               id: nanoid(),
               type: level,
               position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
               data: { label, level, description: '', technology: '', parentId }
          }
          set({ nodes: [...get().nodes, newNode], dirty: true })
     },

     updateNode: (id, data) => {
          set({
               nodes: get().nodes.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, ...data } } : node
               ),
               dirty: true
          })
     },

     deleteNode: (id) => {
          set({
               nodes: get().nodes.filter((n) => n.id !== id && n.data.parentId !== id),
               edges: get().edges.filter((e) => e.source !== id && e.target !== id),
               dirty: true
          })
     },

     deleteNodes: (ids) => {
          const idSet = new Set(ids)
          set({
               nodes: get().nodes.filter((n) => !idSet.has(n.id) && !idSet.has(n.data.parentId as string)),
               edges: get().edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)),
               dirty: true
          })
     },

     duplicateNode: (id) => {
          const node = get().nodes.find((n) => n.id === id)
          if (!node) return
          const newNode: Node<FlowNodeData> = {
               ...node,
               id: nanoid(),
               position: { x: node.position.x + 40, y: node.position.y + 40 },
               selected: false,
               data: { ...node.data }
          }
          set({ nodes: [...get().nodes, newNode], dirty: true })
     },

     duplicateNodes: (ids) => {
          const idSet = new Set(ids)
          const newNodes: Node<FlowNodeData>[] = []
          for (const node of get().nodes) {
               if (idSet.has(node.id)) {
                    newNodes.push({
                         ...node,
                         id: nanoid(),
                         position: { x: node.position.x + 40, y: node.position.y + 40 },
                         selected: false,
                         data: { ...node.data }
                    })
               }
          }
          set({ nodes: [...get().nodes, ...newNodes], dirty: true })
     },

     applyLayout: (direction) => {
          const dir = direction || get().layoutDirection
          const { nodes, edges } = getLayoutedElements(get().nodes, get().edges, dir)
          set({ nodes, edges, layoutDirection: dir })
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
          const { nodes, edges } = archToFlow(raw)
          const dir = raw.layoutDirection || get().layoutDirection
          const layouted = getLayoutedElements(nodes, edges, dir)
          set({
               projectId: id,
               title: raw.title,
               description: raw.description || '',
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
