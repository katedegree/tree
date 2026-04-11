import type { TreeNodes } from '../types'

function nodeToYAML(nodes: TreeNodes, nodeId: string, indent: number): string {
  const node = nodes[nodeId]
  if (!node || node.completed) return ''
  const pad = '  '.repeat(indent)

  if (node.childIds.length === 0) {
    const prefix = node.category ? `[${node.category}]: ` : ''
    return `${pad}- ${prefix}${node.title}`
  }

  const childLines = node.childIds.map((id) => nodeToYAML(nodes, id, indent + 1)).filter(Boolean).join('\n\n')
  return `${pad}- ${node.title}:\n\n${childLines}`
}

export function generateYAML(nodes: TreeNodes, rootId: string): string {
  const root = nodes[rootId]
  if (!root) return ''

  if (root.childIds.length === 0) {
    const prefix = root.category ? `[${root.category}]: ` : ''
    return `${prefix}${root.title}`
  }

  const childLines = root.childIds.map((id) => nodeToYAML(nodes, id, 1)).filter(Boolean).join('\n\n')
  return `${root.title}:\n\n${childLines}`
}
