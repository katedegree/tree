import { useState, useCallback } from 'react'
import type { GoalNode, NodeCategory, TreeNodes } from '../types'

const ROOT_ID = 'root'

function createInitialNodes(): TreeNodes {
  return {
    [ROOT_ID]: {
      id: ROOT_ID,
      title: '最終目標',
      completed: false,
      collapsed: false,
      parentId: null,
      childIds: [],
      category: null,
    },
  }
}

function loadState(): { nodes: TreeNodes; rootId: string } {
  try {
    const saved = localStorage.getItem('goal-tree')
    if (saved) {
      const parsed = JSON.parse(saved)
      // migrate existing nodes that lack category
      Object.values(parsed.nodes as TreeNodes).forEach((n) => {
        if (n.category === undefined) n.category = null
      if (n.collapsed === undefined) n.collapsed = false
      })
      return parsed
    }
  } catch {}
  return { nodes: createInitialNodes(), rootId: ROOT_ID }
}

export function useTree() {
  const [{ nodes, rootId }, setState] = useState(loadState)

  const persist = (newNodes: TreeNodes) => {
    const next = { nodes: newNodes, rootId }
    setState(next)
    localStorage.setItem('goal-tree', JSON.stringify(next))
  }

  const addNode = useCallback(
    (parentId: string, title: string) => {
      const id = crypto.randomUUID()
      const newNode: GoalNode = { id, title, completed: false, collapsed: false, parentId, childIds: [], category: null }
      persist({
        ...nodes,
        [id]: newNode,
        [parentId]: { ...nodes[parentId], childIds: [...nodes[parentId].childIds, id] },
      })
    },
    [nodes],
  )

  const updateNode = useCallback(
    (id: string, title: string) => {
      persist({ ...nodes, [id]: { ...nodes[id], title } })
    },
    [nodes],
  )

  const updateCategory = useCallback(
    (id: string, category: NodeCategory) => {
      persist({ ...nodes, [id]: { ...nodes[id], category } })
    },
    [nodes],
  )

  const toggleComplete = useCallback(
    (id: string) => {
      persist({ ...nodes, [id]: { ...nodes[id], completed: !nodes[id].completed } })
    },
    [nodes],
  )

  const deleteNode = useCallback(
    (id: string) => {
      const toDelete = new Set<string>()
      const collect = (nodeId: string) => {
        toDelete.add(nodeId)
        nodes[nodeId]?.childIds.forEach(collect)
      }
      collect(id)

      const newNodes = Object.fromEntries(Object.entries(nodes).filter(([k]) => !toDelete.has(k)))
      const parentId = nodes[id].parentId
      if (parentId && newNodes[parentId]) {
        newNodes[parentId] = {
          ...newNodes[parentId],
          childIds: newNodes[parentId].childIds.filter((c) => c !== id),
        }
      }
      persist(newNodes)
    },
    [nodes],
  )

  const toggleCollapsed = useCallback(
    (id: string) => {
      persist({ ...nodes, [id]: { ...nodes[id], collapsed: !nodes[id].collapsed } })
    },
    [nodes],
  )

  const reset = useCallback(() => {
    persist(createInitialNodes())
  }, [])

  return { nodes, rootId, addNode, updateNode, updateCategory, toggleComplete, toggleCollapsed, deleteNode, reset }
}
