export type NodeCategory = '意識' | '行動' | null

export interface GoalNode {
  id: string
  title: string
  completed: boolean
  parentId: string | null
  childIds: string[]
  category: NodeCategory
}

export type TreeNodes = Record<string, GoalNode>
