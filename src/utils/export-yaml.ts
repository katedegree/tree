import type { TreeNodes } from "../types";

function charDisplayWidth(ch: string): number {
  const code = ch.codePointAt(0) ?? 0;
  if (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0x303e) ||
    (code >= 0x3041 && code <= 0x33bf) ||
    (code >= 0x33ff && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7ff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe10 && code <= 0xfe6f) ||
    (code >= 0xff01 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x20000 && code <= 0x2fffd) ||
    (code >= 0x30000 && code <= 0x3fffd)
  )
    return 2;
  return 1;
}

function wrapText(text: string, continuation: string): string {
  const maxWidth = 48; // 全角24文字分
  const lines: string[] = [];
  let current = "";
  let currentWidth = 0;

  for (const ch of text) {
    if (ch === "\n") {
      lines.push(current);
      current = "";
      currentWidth = 0;
      continue;
    }
    if (ch === "\r") continue;
    const w = charDisplayWidth(ch);
    if (currentWidth + w > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
      currentWidth = w;
    } else {
      current += ch;
      currentWidth += w;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.join(`\n${continuation}`);
}

function nodeToYAML(nodes: TreeNodes, nodeId: string, indent: number): string {
  const node = nodes[nodeId];
  if (!node || node.completed) return "";
  const pad = "  ".repeat(indent);

  const cont = `${pad}  `; // "- " の分2スペース、タイトル開始位置に揃える
  if (node.childIds.length === 0) {
    const prefix = node.category ? `[${node.category}]: ` : "";
    return `${pad}- ${prefix}${wrapText(node.title, cont)}`;
  }

  const childLines = node.childIds
    .map((id) => nodeToYAML(nodes, id, indent + 1))
    .filter(Boolean)
    .join("\n\n");
  return `${pad}- ${wrapText(node.title, cont)}:\n\n${childLines}`;
}

export function generateYAML(nodes: TreeNodes, rootId: string): string {
  const root = nodes[rootId];
  if (!root) return "";

  if (root.childIds.length === 0) {
    const prefix = root.category ? `[${root.category}]: ` : "";
    return `${prefix}${wrapText(root.title, "")}`;
  }

  const childLines = root.childIds
    .map((id) => nodeToYAML(nodes, id, 1))
    .filter(Boolean)
    .join("\n\n");
  return `${wrapText(root.title, "")}:\n\n${childLines}`;
}
