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
      actions: [],
    },
  }
}

function loadState(): { nodes: TreeNodes; rootId: string } {
  try {
    const saved = localStorage.getItem('goal-tree')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.values(parsed.nodes as TreeNodes).forEach((n) => {
        if (n.category === undefined) n.category = null
        if (n.collapsed === undefined) n.collapsed = false
        if (n.actions === undefined) n.actions = []
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
      const newNode: GoalNode = { id, title, completed: false, collapsed: false, parentId, childIds: [], category: null, actions: [] }
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

  const toggleCollapsed = useCallback(
    (id: string) => {
      persist({ ...nodes, [id]: { ...nodes[id], collapsed: !nodes[id].collapsed } })
    },
    [nodes],
  )

  const addAction = useCallback(
    (nodeId: string) => {
      const action = { id: crypto.randomUUID(), content: '' }
      const node = nodes[nodeId]
      persist({ ...nodes, [nodeId]: { ...node, actions: [...node.actions, action] } })
    },
    [nodes],
  )

  const updateAction = useCallback(
    (nodeId: string, actionId: string, content: string) => {
      const node = nodes[nodeId]
      persist({
        ...nodes,
        [nodeId]: {
          ...node,
          actions: node.actions.map((a) => (a.id === actionId ? { ...a, content } : a)),
        },
      })
    },
    [nodes],
  )

  const deleteAction = useCallback(
    (nodeId: string, actionId: string) => {
      const node = nodes[nodeId]
      persist({ ...nodes, [nodeId]: { ...node, actions: node.actions.filter((a) => a.id !== actionId) } })
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

  const moveNode = useCallback(
    (nodeId: string, newParentId: string, insertIndex?: number) => {
      const node = nodes[nodeId]
      if (!node || !node.parentId || nodeId === newParentId) return
      if (node.parentId === newParentId) return

      // サイクル防止: newParentId が nodeId の子孫でないか確認
      let current: string | null = newParentId
      while (current) {
        if (current === nodeId) return
        current = nodes[current]?.parentId ?? null
      }

      const oldParentId = node.parentId
      const newNodes = { ...nodes }

      newNodes[oldParentId] = {
        ...newNodes[oldParentId],
        childIds: newNodes[oldParentId].childIds.filter((id) => id !== nodeId),
      }

      const newChildIds = [...newNodes[newParentId].childIds]
      if (insertIndex !== undefined && insertIndex >= 0) {
        newChildIds.splice(insertIndex, 0, nodeId)
      } else {
        newChildIds.push(nodeId)
      }
      newNodes[newParentId] = { ...newNodes[newParentId], childIds: newChildIds }
      newNodes[nodeId] = { ...newNodes[nodeId], parentId: newParentId }

      persist(newNodes)
    },
    [nodes],
  )

  const reorderChildren = useCallback(
    (parentId: string, oldIndex: number, newIndex: number) => {
      const parent = nodes[parentId]
      if (!parent) return
      const newChildIds = [...parent.childIds]
      const [removed] = newChildIds.splice(oldIndex, 1)
      newChildIds.splice(newIndex, 0, removed)
      persist({ ...nodes, [parentId]: { ...parent, childIds: newChildIds } })
    },
    [nodes],
  )

  // 自身の子孫への移動: 自分の子を1段上げてから自分をターゲットに入れる
  const moveNodeIntoDescendant = useCallback(
    (nodeId: string, newParentId: string, insertIndex?: number) => {
      const node = nodes[nodeId]
      if (!node || !node.parentId) return

      const oldParentId = node.parentId
      const newNodes = { ...nodes }

      // 1. A の子を A の元いた親に移動（A のいた位置に差し込む）
      const oldParent = newNodes[oldParentId]
      const nodeIndexInParent = oldParent.childIds.indexOf(nodeId)
      const liftedChildIds = node.childIds

      const newOldParentChildIds = [...oldParent.childIds]
      newOldParentChildIds.splice(nodeIndexInParent, 1, ...liftedChildIds)
      newNodes[oldParentId] = { ...oldParent, childIds: newOldParentChildIds }

      liftedChildIds.forEach((childId) => {
        newNodes[childId] = { ...newNodes[childId], parentId: oldParentId }
      })

      // 2. A の子リストを空にして新しい親へ移動
      newNodes[nodeId] = { ...newNodes[nodeId], childIds: [], parentId: newParentId }

      const newParentChildIds = [...newNodes[newParentId].childIds]
      if (insertIndex !== undefined && insertIndex >= 0) {
        newParentChildIds.splice(insertIndex, 0, nodeId)
      } else {
        newParentChildIds.push(nodeId)
      }
      newNodes[newParentId] = { ...newNodes[newParentId], childIds: newParentChildIds }

      persist(newNodes)
    },
    [nodes],
  )

  const reset = useCallback(() => {
    persist(createInitialNodes())
  }, [])

  return { nodes, rootId, addNode, updateNode, updateCategory, toggleComplete, toggleCollapsed, addAction, updateAction, deleteAction, deleteNode, reorderChildren, moveNode, moveNodeIntoDescendant, reset }
}
