import { useTree } from './hooks/useTree'
import { TreeView } from './components/TreeView'

export default function App() {
  const { nodes, rootId, addNode, updateNode, updateCategory, toggleComplete, toggleCollapsed, deleteNode } = useTree()

  return (
    <div className="min-h-screen bg-zinc-950 p-10 overflow-x-auto">
      <TreeView
        rootId={rootId}
        nodes={nodes}
        onAddChild={addNode}
        onUpdate={updateNode}
        onToggle={toggleComplete}
        onDelete={deleteNode}
        onCategoryChange={updateCategory}
        onToggleCollapsed={toggleCollapsed}
      />
    </div>
  )
}
