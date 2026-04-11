import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useTree } from "./hooks";
import { TreeView } from "./components";
import { generateYAML } from "./utils";

export default function () {
  const {
    nodes,
    rootId,
    addNode,
    updateNode,
    updateCategory,
    toggleComplete,
    toggleCollapsed,
    addAction,
    updateAction,
    deleteAction,
    deleteNode,
    reorderChildren,
    moveNode,
    moveNodeIntoDescendant,
  } = useTree();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    let currentNodes = nodes;
    try {
      const saved = localStorage.getItem("goal-tree");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.nodes) currentNodes = data.nodes;
      }
    } catch {}
    const yaml = generateYAML(currentNodes, rootId);
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-10 overflow-x-auto">
      <button
        onClick={handleCopy}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-2 transition-colors"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "コピーしました" : "YAMLをコピー"}
      </button>
      <TreeView
        rootId={rootId}
        nodes={nodes}
        onAddChild={addNode}
        onUpdate={updateNode}
        onToggle={toggleComplete}
        onDelete={deleteNode}
        onCategoryChange={updateCategory}
        onToggleCollapsed={toggleCollapsed}
        onAddAction={addAction}
        onUpdateAction={updateAction}
        onDeleteAction={deleteAction}
        onReorderChildren={reorderChildren}
        onMoveNode={moveNode}
        onMoveNodeIntoDescendant={moveNodeIntoDescendant}
      />
    </div>
  );
}
