import type { ArchitectureData, ArchNode, ArchNodeNotes, NodeLevel } from '../../types/architecture'
import { nanoid } from 'nanoid'

type ParsedConnection = {
     sourceName: string
     targetName: string
     label?: string
}

const LEVEL_ORDER: NodeLevel[] = ['system', 'container', 'component', 'code']

function normalizeRefName(value: string): string {
     return value
          .trim()
          .replace(/^['"`]|['"`]$/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/\s+/g, ' ')
          .toLowerCase()
}

function getParentLevelFromChildLevels(childLevels: NodeLevel[]): NodeLevel {
     if (childLevels.length === 0) return 'container'

     const minChildLevelIndex = Math.min(
          ...childLevels.map((level) => LEVEL_ORDER.indexOf(level)).filter((i) => i >= 0)
     )

     if (minChildLevelIndex <= 0) return 'system'
     return LEVEL_ORDER[minChildLevelIndex - 1]
}

function parseConnectionLine(line: string): ParsedConnection | null {
     const trimmed = line.trim()
     if (!trimmed.startsWith('-') && !trimmed.startsWith('*')) return null

     const match = trimmed.match(
          /^[-*]\s+(.+?)\s*(?:-{1,3}>|->|→)\s*(.+?)(?:\s*:\s*(?:"([^"]+)"|'([^']+)'|(.+)))?\s*$/
     )
     if (!match) return null

     const sourceName = match[1].trim()
     const targetName = match[2].trim()
     const labelRaw = match[3] ?? match[4] ?? match[5]
     const label = labelRaw?.trim()

     if (!sourceName || !targetName) return null

     return { sourceName, targetName, label }
}

function parseListField(value: string): string[] {
     return value
          .split(/[;,]/)
          .map((item) => item.trim())
          .filter(Boolean)
}

function ensureNoteBlocks(node: ArchNode): ArchNodeNotes {
     if (!node.noteBlocks) {
          node.noteBlocks = {}
     }
     return node.noteBlocks
}

export function parseMDSchema(md: string): ArchitectureData {
     const data: ArchitectureData = { title: 'Untitled', nodes: [], edges: [] }

     // Normalize line endings
     const normalized = md.replace(/\r\n/g, '\n').trim()

     // Parse YAML frontmatter
     const frontmatterMatch = normalized.match(/^---\s*\n([\s\S]*?)\n---/)
     if (frontmatterMatch) {
          const fm = frontmatterMatch[1]
          const titleMatch = fm.match(/^title:\s*(.+)$/m)
          const descMatch = fm.match(/^description:\s*(.+)$/m)
          if (titleMatch) data.title = titleMatch[1].trim()
          if (descMatch) data.description = descMatch[1].trim()
     }

     // Split by sections (# heading) — handle optional whitespace
     const sections = normalized.split(/^#\s+/m).slice(1)
     const nodesByName = new Map<string, ArchNode>()
     const nodesByNormalizedName = new Map<string, ArchNode>()
     const parsedConnections: ParsedConnection[] = []

     const registerNode = (node: ArchNode): void => {
          const exact = node.label.trim()
          nodesByName.set(exact, node)
          nodesByNormalizedName.set(normalizeRefName(exact), node)
          data.nodes.push(node)
     }

     const findNodeByReference = (name: string): ArchNode | undefined => {
          const exact = nodesByName.get(name.trim())
          if (exact) return exact
          return nodesByNormalizedName.get(normalizeRefName(name))
     }

     const ensureNodeForReference = (
          rawName: string,
          levelHint: NodeLevel = 'container'
     ): ArchNode => {
          const existing = findNodeByReference(rawName)
          if (existing) return existing

          const label = rawName.trim().replace(/^['"`]|['"`]$/g, '')
          const node: ArchNode = {
               id: nanoid(),
               label,
               level: levelHint,
               description: 'Auto-generated from referenced connection/parent.'
          }

          registerNode(node)
          return node
     }

     for (const section of sections) {
          const lines = section.split('\n')
          const sectionName = lines[0].trim().toLowerCase()

          if (sectionName === 'connections') {
               // Parse connections (resolved after all nodes are known)
               for (const line of lines.slice(1)) {
                    const parsed = parseConnectionLine(line)
                    if (parsed) parsedConnections.push(parsed)
               }
               continue
          }

          // Parse nodes in this section
          const nodeBlocks = section.split(/^##\s+/m).slice(1)
          for (const block of nodeBlocks) {
               const blockLines = block.split('\n')
               // Match: NodeName [level] — handle extra whitespace and trailing chars
               const headerMatch = blockLines[0].match(/^(.+?)\s*\[([^\]]+)\]/)
               if (!headerMatch) continue

               const label = headerMatch[1].trim()
               const levelRaw = headerMatch[2].trim().toLowerCase()
               if (!levelRaw) continue

               const node: ArchNode = { id: nanoid(), label, level: levelRaw }

               for (const line of blockLines.slice(1)) {
                    // Supports keys like notes.summary in addition to standard keys
                    const metaMatch = line.match(
                         /^[-*]\s+\*{1,2}([\w.-]+)\*{1,2}:\s*(.+)$/
                    )
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
                              // Skip null/none/empty parent values
                              if (value && value !== 'null' && value !== 'none' && value !== '') {
                                   node.parentId = value
                              }
                              break
                         case 'tags':
                              node.tags = value.split(',').map((t) => t.trim()).filter(Boolean)
                              break
                         case 'notes':
                              node.notes = value
                              break
                         case 'notes.summary':
                              ensureNoteBlocks(node).summary = value
                              break
                         case 'notes.responsibilities':
                              ensureNoteBlocks(node).responsibilities = parseListField(value)
                              break
                         case 'notes.decisions':
                              ensureNoteBlocks(node).decisions = parseListField(value)
                              break
                         case 'notes.risks':
                              ensureNoteBlocks(node).risks = parseListField(value)
                              break
                         case 'notes.nextsteps':
                         case 'notes.next_steps':
                              ensureNoteBlocks(node).nextSteps = parseListField(value)
                              break
                    }
               }

               registerNode(node)
          }
     }

     // Resolve parent references (name → id), auto-create missing parents
     for (const node of data.nodes) {
          if (node.parentId && !data.nodes.find((n) => n.id === node.parentId)) {
               const parentName = node.parentId
               const siblingChildren = data.nodes.filter((n) => n.parentId === parentName)
               const inferredParentLevel = getParentLevelFromChildLevels(
                    siblingChildren.map((n) => n.level)
               )
               const parent = ensureNodeForReference(parentName, inferredParentLevel)
               node.parentId = parent.id
          }
     }

     // Resolve parsed connections (handles sections in any order)
     for (const conn of parsedConnections) {
          const sourceNode =
               findNodeByReference(conn.sourceName) || ensureNodeForReference(conn.sourceName, 'container')
          const targetNode =
               findNodeByReference(conn.targetName) || ensureNodeForReference(conn.targetName, 'container')

          const duplicate = data.edges.some(
               (e) => e.sourceId === sourceNode.id && e.targetId === targetNode.id && e.label === conn.label
          )
          if (duplicate) continue

          data.edges.push({
               id: nanoid(),
               sourceId: sourceNode.id,
               targetId: targetNode.id,
               label: conn.label
          })
     }

     return data
}
