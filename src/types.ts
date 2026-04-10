export type NodeCategory = '意識' | '行動' | null

export interface ActionRecord {
  id: string
  content: string
}

export interface GoalNode {
  id: string
  title: string
  completed: boolean
  collapsed: boolean
  parentId: string | null
  childIds: string[]
  category: NodeCategory
  actions: ActionRecord[]
}

export type TreeNodes = Record<string, GoalNode>
