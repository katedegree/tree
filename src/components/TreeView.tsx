import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { NodeCategory, TreeNodes } from "../types";
import { NodeCard } from "./NodeCard";
import { Plus } from "lucide-react";

function AddRow({ onAdd }: { onAdd: (title: string) => void }) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
      setActive(false);
    }
  };

  if (active) {
    return (
      <div className="w-120 border border-dashed border-zinc-600 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (!value.trim()) {
              setActive(false);
              setValue("");
            } else submit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") {
              setActive(false);
              setValue("");
            }
          }}
          placeholder="達成条件を仮定する..."
          className="flex-1 min-w-0 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setActive(true)}
      className="w-120 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-zinc-600 hover:text-zinc-400"
    >
      <span className="text-sm flex items-center gap-2">
        <Plus size={16} />
        追加する
      </span>
    </button>
  );
}

interface ChildrenSectionProps {
  parentId: string;
  childIds: string[];
  nodes: TreeNodes;
  onAddChild: (parentId: string, title: string) => void;
  onUpdate: (id: string, title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, category: NodeCategory) => void;
}

function ChildrenSection({
  parentId,
  childIds,
  nodes,
  onAddChild,
  onUpdate,
  onToggle,
  onDelete,
  onCategoryChange,
}: ChildrenSectionProps) {
  return (
    <div className="ml-6 mt-3 border-l border-zinc-600">
      <AnimatePresence>
        {childIds.map((childId) => (
          <motion.div
            key={childId}
            className="relative pl-5 pb-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="absolute left-0 top-5 h-px w-5 bg-zinc-600" />
            <TreeRow
              nodeId={childId}
              nodes={nodes}
              onAddChild={onAddChild}
              onUpdate={onUpdate}
              onToggle={onToggle}
              onDelete={onDelete}
              onCategoryChange={onCategoryChange}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative pl-5 pb-4">
        <div className="absolute left-0 top-5 h-px w-5 bg-zinc-600" />
        <div className="absolute -left-px top-5 bottom-0 w-0.5 bg-zinc-950" />
        <AddRow onAdd={(title) => onAddChild(parentId, title)} />
      </div>
    </div>
  );
}

interface RowProps {
  nodeId: string;
  nodes: TreeNodes;
  onAddChild: (parentId: string, title: string) => void;
  onUpdate: (id: string, title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, category: NodeCategory) => void;
}

function TreeRow({
  nodeId,
  nodes,
  onAddChild,
  onUpdate,
  onToggle,
  onDelete,
  onCategoryChange,
}: RowProps) {
  const node = nodes[nodeId];
  if (!node) return null;

  const isLeaf = node.childIds.length === 0;

  return (
    <div>
      <NodeCard
        node={node}
        isLeaf={isLeaf}
        onUpdate={(title) => onUpdate(nodeId, title)}
        onToggle={() => onToggle(nodeId)}
        onDelete={() => onDelete(nodeId)}
        onCategoryChange={(cat) => onCategoryChange(nodeId, cat)}
      />
      <ChildrenSection
        parentId={nodeId}
        childIds={node.childIds}
        nodes={nodes}
        onAddChild={onAddChild}
        onUpdate={onUpdate}
        onToggle={onToggle}
        onDelete={onDelete}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
}

interface TreeViewProps {
  rootId: string;
  nodes: TreeNodes;
  onAddChild: (parentId: string, title: string) => void;
  onUpdate: (id: string, title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, category: NodeCategory) => void;
}

export function TreeView({
  rootId,
  nodes,
  onAddChild,
  onUpdate,
  onToggle,
  onDelete,
  onCategoryChange,
}: TreeViewProps) {
  const root = nodes[rootId];
  if (!root) return null;

  return (
    <div>
      <NodeCard
        node={root}
        isRoot
        isLeaf={root.childIds.length === 0}
        onUpdate={(title) => onUpdate(rootId, title)}
        onToggle={() => onToggle(rootId)}
        onDelete={() => {}}
        onCategoryChange={(cat) => onCategoryChange(rootId, cat)}
      />
      <ChildrenSection
        parentId={rootId}
        childIds={root.childIds}
        nodes={nodes}
        onAddChild={onAddChild}
        onUpdate={onUpdate}
        onToggle={onToggle}
        onDelete={onDelete}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
}
