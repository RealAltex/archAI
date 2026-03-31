import { create } from 'zustand'
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import type { ArchitectureData } from '../types/architecture'
import type { FlowNodeData } from '../lib/flow-adapter'
import { archToFlow, flowToArch } from '../lib/flow-adapter'
import { serializeMDSchema } from '../lib/md-schema/serializer'
import { getLayoutedElements, type LayoutDirection } from '../components/Canvas/layout'
import { nanoid } from 'nanoid'

interface ArchitectureStore {
     // Data
     title: string
     description: string
     nodes: Node<FlowNodeData>[]
     edges: Edge[]
     layoutDirection: LayoutDirection

     // Actions
     setArchitectureData: (data: ArchitectureData) => void
     onNodesChange: OnNodesChange<Node<FlowNodeData>>
     onEdgesChange: OnEdgesChange
     onConnect: (connection: Connection) => void
     addNode: (label: string, level: string, parentId?: string) => void
     updateNode: (id: string, data: Partial<FlowNodeData>) => void
     deleteNode: (id: string) => void
     applyLayout: (direction?: LayoutDirection) => void
     setLayoutDirection: (direction: LayoutDirection) => void
     getArchitectureData: () => ArchitectureData
     getMDContent: () => string
     reset: () => void
}

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
     title: 'Untitled Project',
     description: '',
     nodes: [],
     edges: [],
     layoutDirection: 'TB',

     setArchitectureData: (data) => {
          const { nodes, edges } = archToFlow(data)
          const layouted = getLayoutedElements(nodes, edges, get().layoutDirection)
          set({
               title: data.title,
               description: data.description || '',
               nodes: layouted.nodes,
               edges: layouted.edges
          })
     },

     onNodesChange: (changes) => {
          set({ nodes: applyNodeChanges(changes, get().nodes) })
     },

     onEdgesChange: (changes) => {
          set({ edges: applyEdgeChanges(changes, get().edges) })
     },

     onConnect: (connection) => {
          set({ edges: addEdge({ ...connection, id: nanoid() }, get().edges) })
     },

     addNode: (label, level, parentId) => {
          const newNode: Node<FlowNodeData> = {
               id: nanoid(),
               type: level,
               position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
               data: { label, level, description: '', technology: '', parentId }
          }
          set({ nodes: [...get().nodes, newNode] })
     },

     updateNode: (id, data) => {
          set({
               nodes: get().nodes.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, ...data } } : node
               )
          })
     },

     deleteNode: (id) => {
          set({
               nodes: get().nodes.filter((n) => n.id !== id && n.parentId !== id),
               edges: get().edges.filter((e) => e.source !== id && e.target !== id)
          })
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

     reset: () => set({ title: 'Untitled Project', description: '', nodes: [], edges: [] })
}))
