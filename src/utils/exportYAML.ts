import type { TreeNodes } from '../types'

function nodeToYAML(nodes: TreeNodes, nodeId: string, indent: number): string {
  const node = nodes[nodeId]
  if (!node) return ''
  const pad = '  '.repeat(indent)

  const check = node.completed ? '⭕️ ' : '❌ '

  if (node.childIds.length === 0) {
    const prefix = node.category ? `[${node.category}]: ` : ''
    return `${pad}- ${check}${prefix}${node.title}`
  }

  const childLines = node.childIds.map((id) => nodeToYAML(nodes, id, indent + 1)).join('\n')
  return `${pad}- ${check}${node.title}:\n${childLines}`
}

export function generateYAML(nodes: TreeNodes, rootId: string): string {
  const root = nodes[rootId]
  if (!root) return ''

  const check = root.completed ? '⭕️ ' : '❌ '

  if (root.childIds.length === 0) {
    const prefix = root.category ? `[${root.category}]: ` : ''
    return `${check}${prefix}${root.title}`
  }

  const childLines = root.childIds.map((id) => nodeToYAML(nodes, id, 1)).join('\n')
  return `${check}${root.title}:\n${childLines}`
}
