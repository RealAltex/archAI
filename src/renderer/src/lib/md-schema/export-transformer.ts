import type { ArchitectureData } from '../../types/architecture'

const DEFAULT_LEVEL_ORDER = ['system', 'container', 'component', 'code'] as const
const DEFAULT_LEVEL_TITLES: Record<string, string> = {
     system: 'Systems',
     container: 'Containers',
     component: 'Components',
     code: 'Code Elements'
}

function toTitleCase(input: string): string {
     return input
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase())
}

function levelTitle(level: string): string {
     const predefined = DEFAULT_LEVEL_TITLES[level]
     if (predefined) return predefined
     const title = toTitleCase(level)
     return title.endsWith('s') ? title : `${title}s`
}

export function transformToExportMD(data: ArchitectureData): string {
     const lines: string[] = []

     // Header
     lines.push(`# Software Architecture: ${data.title}`)
     if (data.description) lines.push(`> ${data.description}`)
     lines.push('')

     // Build lookup maps
     const nodeMap = new Map(data.nodes.map((n) => [n.id, n]))

     // Overview
     const counts = new Map<string, number>()
     for (const node of data.nodes) {
          counts.set(node.level, (counts.get(node.level) || 0) + 1)
     }

     const orderedLevels = [
          ...DEFAULT_LEVEL_ORDER.filter((level) => counts.has(level)),
          ...Array.from(counts.keys())
               .filter((level) => !DEFAULT_LEVEL_ORDER.includes(level as (typeof DEFAULT_LEVEL_ORDER)[number]))
               .sort((a, b) => a.localeCompare(b))
     ]

     lines.push('## Overview')
     if (orderedLevels.length === 0) {
          lines.push('This architecture currently has no nodes.')
     } else {
          const summary = orderedLevels
               .map((level) => `${counts.get(level) || 0} ${levelTitle(level).toLowerCase()}`)
               .join(', ')
          lines.push(`This architecture consists of ${summary}.`)
     }
     lines.push('')

     // Detail each level
     for (const level of orderedLevels) {
          const nodes = data.nodes.filter((n) => n.level === level)
          if (nodes.length === 0) continue

          lines.push(`## ${levelTitle(level)}`)
          lines.push('')

          for (const node of nodes) {
               lines.push(`### ${node.label}`)
               lines.push(`- **Type**: ${node.level}`)
               if (node.technology) lines.push(`- **Technology**: ${node.technology}`)
               if (node.description) lines.push(`- **Purpose**: ${node.description}`)

               // Parent
               if (node.parentId) {
                    const parent = nodeMap.get(node.parentId)
                    if (parent) lines.push(`- **Part of**: ${parent.label}`)
               }

               // Children
               const children = data.nodes.filter((n) => n.parentId === node.id)
               if (children.length > 0) {
                    lines.push(`- **Contains**: ${children.map((c) => c.label).join(', ')}`)
               }

               // Connections
               const outgoing = data.edges.filter((e) => e.sourceId === node.id)
               const incoming = data.edges.filter((e) => e.targetId === node.id)

               for (const edge of outgoing) {
                    const target = nodeMap.get(edge.targetId)
                    if (target) lines.push(`- **Sends to**: ${target.label} (${edge.label || 'connects'})`)
               }
               for (const edge of incoming) {
                    const source = nodeMap.get(edge.sourceId)
                    if (source) lines.push(`- **Receives from**: ${source.label} (${edge.label || 'connects'})`)
               }

               if (node.tags && node.tags.length > 0) lines.push(`- **Tags**: ${node.tags.join(', ')}`)
               if (node.notes) lines.push(`- **Notes**: ${node.notes}`)
               lines.push('')
          }
     }

     // Mermaid diagram
     if (data.edges.length > 0) {
          lines.push('## Dependency Graph')
          lines.push('')
          lines.push('```mermaid')
          lines.push('graph TD')
          for (const node of data.nodes) {
               const safeId = node.label.replace(/[^a-zA-Z0-9]/g, '_')
               lines.push(`    ${safeId}["${node.label}"]`)
          }
          for (const edge of data.edges) {
               const source = nodeMap.get(edge.sourceId)
               const target = nodeMap.get(edge.targetId)
               if (source && target) {
                    const sId = source.label.replace(/[^a-zA-Z0-9]/g, '_')
                    const tId = target.label.replace(/[^a-zA-Z0-9]/g, '_')
                    const label = edge.label ? `|"${edge.label}"|` : ''
                    lines.push(`    ${sId} -->${label} ${tId}`)
               }
          }
          lines.push('```')
          lines.push('')
     }

     return lines.join('\n')
}
