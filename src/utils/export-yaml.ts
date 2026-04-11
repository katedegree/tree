import type { TreeNodes } from '../types'

function charDisplayWidth(ch: string): number {
  const code = ch.codePointAt(0) ?? 0
  if (
    (code >= 0x1100 && code <= 0x115F) ||
    (code >= 0x2E80 && code <= 0x303E) ||
    (code >= 0x3041 && code <= 0x33BF) ||
    (code >= 0x33FF && code <= 0xA4CF) ||
    (code >= 0xAC00 && code <= 0xD7FF) ||
    (code >= 0xF900 && code <= 0xFAFF) ||
    (code >= 0xFE10 && code <= 0xFE6F) ||
    (code >= 0xFF01 && code <= 0xFF60) ||
    (code >= 0xFFE0 && code <= 0xFFE6) ||
    (code >= 0x20000 && code <= 0x2FFFD) ||
    (code >= 0x30000 && code <= 0x3FFFD)
  ) return 2
  return 1
}

function wrapText(text: string, continuation: string): string {
  const maxWidth = 48 // 全角24文字分
  const lines: string[] = []
  let current = ''
  let currentWidth = 0

  for (const ch of text) {
    if (ch === '\n') {
      lines.push(current)
      current = ''
      currentWidth = 0
      continue
    }
    if (ch === '\r') continue
    const w = charDisplayWidth(ch)
    if (currentWidth + w > maxWidth && current.length > 0) {
      lines.push(current)
      current = ch
      currentWidth = w
    } else {
      current += ch
      currentWidth += w
    }
  }
  if (current.length > 0) lines.push(current)
  return lines.join(`\n${continuation}`)
}

function nodeToYAML(nodes: TreeNodes, nodeId: string, indent: number): string {
  const node = nodes[nodeId]
  if (!node || node.completed) return ''
  const pad = '  '.repeat(indent)

  const cont = `${pad}  ` // "- " の分2スペース、タイトル開始位置に揃える
  if (node.childIds.length === 0) {
    const prefix = node.category ? `[${node.category}]: ` : ''
    return `${pad}- ${prefix}${wrapText(node.title, cont)}`
  }

  const childLines = node.childIds.map((id) => nodeToYAML(nodes, id, indent + 1)).filter(Boolean).join('\n\n')
  return `${pad}- ${wrapText(node.title, cont)}:\n\n${childLines}`
}

export function generateYAML(nodes: TreeNodes, rootId: string): string {
  const root = nodes[rootId]
  if (!root) return ''

  if (root.childIds.length === 0) {
    const prefix = root.category ? `[${root.category}]: ` : ''
    return `${prefix}${wrapText(root.title, '')}`
  }

  const childLines = root.childIds.map((id) => nodeToYAML(nodes, id, 1)).filter(Boolean).join('\n\n')
  return `${wrapText(root.title, '')}:\n\n${childLines}`
}
