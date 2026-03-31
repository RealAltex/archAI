import type { ArchitectureData, ArchNode, NodeLevel } from '../../types/architecture'

const LEVEL_ORDER: NodeLevel[] = ['system', 'container', 'component', 'code']
const SECTION_NAMES: Record<NodeLevel, string> = {
     system: 'Systems',
     container: 'Containers',
     component: 'Components',
     code: 'Code'
}

export function serializeMDSchema(data: ArchitectureData): string {
     const lines: string[] = []

     // Frontmatter
     lines.push('---')
     lines.push(`title: ${data.title}`)
     if (data.description) lines.push(`description: ${data.description}`)
     lines.push('---')
     lines.push('')

     // Build id→label map for parent/connection references
     const idToLabel = new Map<string, string>()
     for (const node of data.nodes) {
          idToLabel.set(node.id, node.label)
     }

     // Group nodes by level
     const grouped = new Map<NodeLevel, ArchNode[]>()
     for (const level of LEVEL_ORDER) {
          grouped.set(level, [])
     }
     for (const node of data.nodes) {
          grouped.get(node.level)?.push(node)
     }

     // Serialize each level section
     for (const level of LEVEL_ORDER) {
          const nodes = grouped.get(level) || []
          if (nodes.length === 0) continue

          lines.push(`# ${SECTION_NAMES[level]}`)
          lines.push('')

          const sorted = [...nodes].sort((a, b) => a.label.localeCompare(b.label))
          for (const node of sorted) {
               lines.push(`## ${node.label} [${node.level}]`)
               if (node.parentId) {
                    const parentLabel = idToLabel.get(node.parentId)
                    if (parentLabel) lines.push(`- **parent**: ${parentLabel}`)
               }
               if (node.technology) lines.push(`- **technology**: ${node.technology}`)
               if (node.description) lines.push(`- **description**: ${node.description}`)
               if (node.tags && node.tags.length > 0) lines.push(`- **tags**: ${node.tags.join(', ')}`)
               if (node.notes) lines.push(`- **notes**: ${node.notes}`)
               lines.push('')
          }
     }

     // Connections
     if (data.edges.length > 0) {
          lines.push('# Connections')
          lines.push('')
          for (const edge of data.edges) {
               const sourceLabel = idToLabel.get(edge.sourceId) || edge.sourceId
               const targetLabel = idToLabel.get(edge.targetId) || edge.targetId
               lines.push(`- ${sourceLabel} --> ${targetLabel}: "${edge.label || 'connects to'}"`)
          }
          lines.push('')
     }

     return lines.join('\n')
}
