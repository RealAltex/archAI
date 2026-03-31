import type { ArchitectureData, ArchNode } from '../../types/architecture'

const DEFAULT_LEVEL_ORDER = ['system', 'container', 'component', 'code'] as const
const DEFAULT_SECTION_NAMES: Record<string, string> = {
     system: 'Systems',
     container: 'Containers',
     component: 'Components',
     code: 'Code'
}

function toTitleCase(input: string): string {
     return input
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getSectionNameForLevel(level: string): string {
     const predefined = DEFAULT_SECTION_NAMES[level]
     if (predefined) return predefined

     const title = toTitleCase(level)
     return title.endsWith('s') ? title : `${title}s`
}

function joinList(items?: string[]): string | null {
     if (!items || items.length === 0) return null
     const normalized = items.map((item) => item.trim()).filter(Boolean)
     if (normalized.length === 0) return null
     return normalized.join('; ')
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
     const grouped = new Map<string, ArchNode[]>()
     for (const node of data.nodes) {
          const bucket = grouped.get(node.level)
          if (bucket) {
               bucket.push(node)
          } else {
               grouped.set(node.level, [node])
          }
     }

     const allLevels = Array.from(grouped.keys())
     const orderedLevels = [
          ...DEFAULT_LEVEL_ORDER.filter((level) => grouped.has(level)),
          ...allLevels
               .filter((level) => !DEFAULT_LEVEL_ORDER.includes(level as (typeof DEFAULT_LEVEL_ORDER)[number]))
               .sort((a, b) => a.localeCompare(b))
     ]

     // Serialize each level section
     for (const level of orderedLevels) {
          const nodes = grouped.get(level) || []
          if (nodes.length === 0) continue

          lines.push(`# ${getSectionNameForLevel(level)}`)
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

               if (node.noteBlocks?.summary) {
                    lines.push(`- **notes.summary**: ${node.noteBlocks.summary}`)
               }

               const responsibilities = joinList(node.noteBlocks?.responsibilities)
               if (responsibilities) {
                    lines.push(`- **notes.responsibilities**: ${responsibilities}`)
               }

               const decisions = joinList(node.noteBlocks?.decisions)
               if (decisions) {
                    lines.push(`- **notes.decisions**: ${decisions}`)
               }

               const risks = joinList(node.noteBlocks?.risks)
               if (risks) {
                    lines.push(`- **notes.risks**: ${risks}`)
               }

               const nextSteps = joinList(node.noteBlocks?.nextSteps)
               if (nextSteps) {
                    lines.push(`- **notes.nextSteps**: ${nextSteps}`)
               }

               lines.push('')
          }
     }

     // Connections (deterministic output for better diffs)
     if (data.edges.length > 0) {
          lines.push('# Connections')
          lines.push('')

          const sortedEdges = [...data.edges].sort((a, b) => {
               const aSource = idToLabel.get(a.sourceId) || a.sourceId
               const bSource = idToLabel.get(b.sourceId) || b.sourceId
               const sourceCmp = aSource.localeCompare(bSource)
               if (sourceCmp !== 0) return sourceCmp

               const aTarget = idToLabel.get(a.targetId) || a.targetId
               const bTarget = idToLabel.get(b.targetId) || b.targetId
               const targetCmp = aTarget.localeCompare(bTarget)
               if (targetCmp !== 0) return targetCmp

               return (a.label || '').localeCompare(b.label || '')
          })

          for (const edge of sortedEdges) {
               const sourceLabel = idToLabel.get(edge.sourceId) || edge.sourceId
               const targetLabel = idToLabel.get(edge.targetId) || edge.targetId
               lines.push(`- ${sourceLabel} --> ${targetLabel}: "${edge.label || 'connects to'}"`)
          }
          lines.push('')
     }

     return lines.join('\n')
}
