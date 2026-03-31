import type { ArchitectureData, ArchNode, NodeLevel } from '../../types/architecture'
import { nanoid } from 'nanoid'

const VALID_LEVELS: NodeLevel[] = ['system', 'container', 'component', 'code']

export function parseMDSchema(md: string): ArchitectureData {
     const data: ArchitectureData = { title: 'Untitled', nodes: [], edges: [] }

     // Parse YAML frontmatter
     const frontmatterMatch = md.match(/^---\n([\s\S]*?)\n---/)
     if (frontmatterMatch) {
          const fm = frontmatterMatch[1]
          const titleMatch = fm.match(/^title:\s*(.+)$/m)
          const descMatch = fm.match(/^description:\s*(.+)$/m)
          if (titleMatch) data.title = titleMatch[1].trim()
          if (descMatch) data.description = descMatch[1].trim()
     }

     // Split by sections (# heading)
     const sections = md.split(/^# /m).slice(1)
     const nodesByName = new Map<string, ArchNode>()

     for (const section of sections) {
          const lines = section.split('\n')
          const sectionName = lines[0].trim().toLowerCase()

          if (sectionName === 'connections') {
               // Parse connections
               for (const line of lines.slice(1)) {
                    const connMatch = line.match(/^- (.+?) --> (.+?):\s*"(.+?)"/)
                    if (connMatch) {
                         const sourceNode = nodesByName.get(connMatch[1].trim())
                         const targetNode = nodesByName.get(connMatch[2].trim())
                         if (sourceNode && targetNode) {
                              data.edges.push({
                                   id: nanoid(),
                                   sourceId: sourceNode.id,
                                   targetId: targetNode.id,
                                   label: connMatch[3]
                              })
                         }
                    }
               }
               continue
          }

          // Parse nodes in this section
          const nodeBlocks = section.split(/^## /m).slice(1)
          for (const block of nodeBlocks) {
               const blockLines = block.split('\n')
               const headerMatch = blockLines[0].match(/^(.+?)\s*\[(\w+)\]/)
               if (!headerMatch) continue

               const label = headerMatch[1].trim()
               const level = headerMatch[2] as NodeLevel
               if (!VALID_LEVELS.includes(level)) continue

               const node: ArchNode = { id: nanoid(), label, level }

               for (const line of blockLines.slice(1)) {
                    const metaMatch = line.match(/^- \*\*(\w+)\*\*:\s*(.+)$/)
                    if (!metaMatch) continue

                    const key = metaMatch[1].toLowerCase()
                    const value = metaMatch[2].trim()

                    switch (key) {
                         case 'technology':
                              node.technology = value
                              break
                         case 'description':
                              node.description = value
                              break
                         case 'parent':
                              // Resolve later
                              node.parentId = value
                              break
                         case 'tags':
                              node.tags = value.split(',').map((t) => t.trim())
                              break
                         case 'notes':
                              node.notes = value
                              break
                    }
               }

               nodesByName.set(label, node)
               data.nodes.push(node)
          }
     }

     // Resolve parent references (name → id)
     for (const node of data.nodes) {
          if (node.parentId && !data.nodes.find((n) => n.id === node.parentId)) {
               const parent = nodesByName.get(node.parentId)
               node.parentId = parent?.id
          }
     }

     return data
}
