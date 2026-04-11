import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";

// ポインターが重なっている要素を優先し、複数ある場合は最小面積（最も具体的）を選ぶ
const treeCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) {
    return [...pointerCollisions].sort((a, b) => {
      const aRect = args.droppableRects.get(a.id)
      const bRect = args.droppableRects.get(b.id)
      if (!aRect || !bRect) return 0
      return aRect.width * aRect.height - bRect.width * bRect.height
    })
  }
  return closestCenter(args)
}

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GoalNode, NodeCategory, TreeNodes } from "../types";
import { NodeCard } from "./node-card";
import { useDragStore } from "../stores";
import { Plus } from "lucide-react";

const ZONE_PREFIX = "zone-top-";
const isTopZone = (id: string) => id.startsWith(ZONE_PREFIX);
const getZoneParentId = (id: string) => id.slice(ZONE_PREFIX.length);

// X座標のdeltaからドロップ先の親IDと挿入位置を計算する
// xDelta > 20  → overの子（末尾に追加）
// -20..20      → overと同レベル（overの親の子、overの位置に挿入）
// xDelta < -20 → 一段上（overの親の兄弟位置に挿入）
function resolveTarget(
  overId: string,
  xDelta: number,
  nodes: TreeNodes
): { parentId: string; insertIndex?: number } | null {
  const overNode = nodes[overId];
  if (!overNode) return null;

  if (xDelta > 20) {
    return { parentId: overId }; // insertIndex undefined = 末尾
  } else if (xDelta >= -20) {
    if (!overNode.parentId) return null;
    const parent = nodes[overNode.parentId];
    const idx = parent.childIds.indexOf(overId);
    return { parentId: overNode.parentId, insertIndex: idx >= 0 ? idx : undefined };
  } else {
    // 一段上
    const overParentId = overNode.parentId;
    if (!overParentId) return null;
    const overParent = nodes[overParentId];
    const grandParentId = overParent.parentId;
    if (!grandParentId) {
      // これ以上上がれないので同レベル扱い
      const idx = overParent.childIds.indexOf(overId);
      return { parentId: overParentId, insertIndex: idx >= 0 ? idx : undefined };
    }
    const grandParent = nodes[grandParentId];
    const idx = grandParent.childIds.indexOf(overParentId);
    return { parentId: grandParentId, insertIndex: idx >= 0 ? idx : undefined };
  }
}

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
          onBlur={() => { if (!value.trim()) { setActive(false); setValue(""); } else submit(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") { setActive(false); setValue(""); }
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

interface SharedHandlers {
  onAddChild: (parentId: string, title: string) => void;
  onUpdate: (id: string, title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, category: NodeCategory) => void;
  onToggleCollapsed: (id: string) => void;
  onAddAction: (nodeId: string) => void;
  onUpdateAction: (nodeId: string, actionId: string, content: string) => void;
  onDeleteAction: (nodeId: string, actionId: string) => void;
  onReorderChildren: (parentId: string, oldIndex: number, newIndex: number) => void;
  onMoveNode: (nodeId: string, newParentId: string, insertIndex?: number) => void;
}

function FirstChildZone({ parentId }: { parentId: string }) {
  const { setNodeRef } = useDroppable({ id: `${ZONE_PREFIX}${parentId}` });
  return <div ref={setNodeRef} className="h-4" />;
}

function GhostCard({ node }: { node: GoalNode }) {
  return (
    <motion.div
      className="relative pl-5 pb-4 pointer-events-none"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
    >
      <div className="absolute left-0 top-5 h-px w-5 bg-zinc-600" />
      <div className="opacity-35">
        <NodeCard
          node={node}
          isLeaf={node.childIds.length === 0}
          hasChildren={false}
          onUpdate={() => {}} onToggle={() => {}} onDelete={() => {}}
          onCategoryChange={() => {}} onToggleCollapse={() => {}}
          onAddAction={() => {}} onUpdateAction={() => {}} onDeleteAction={() => {}}
        />
      </div>
    </motion.div>
  );
}

function TreeRow({
  nodeId, nodes,
  dragListeners, dragAttributes,
  ...handlers
}: { nodeId: string; nodes: TreeNodes; dragListeners?: Record<string, unknown>; dragAttributes?: Record<string, unknown> } & SharedHandlers) {
  const node = nodes[nodeId];
  if (!node) return null;

  const isLeaf = node.childIds.length === 0;
  const hasChildren = node.childIds.length > 0;

  return (
    <div>
      <NodeCard
        node={node}
        isLeaf={isLeaf}
        hasChildren={hasChildren}
        collapsed={node.collapsed}
        onUpdate={(title) => handlers.onUpdate(nodeId, title)}
        onToggle={() => handlers.onToggle(nodeId)}
        onDelete={() => handlers.onDelete(nodeId)}
        onCategoryChange={(cat) => handlers.onCategoryChange(nodeId, cat)}
        onToggleCollapse={() => handlers.onToggleCollapsed(nodeId)}
        onAddAction={() => handlers.onAddAction(nodeId)}
        onUpdateAction={(actionId, content) => handlers.onUpdateAction(nodeId, actionId, content)}
        onDeleteAction={(actionId) => handlers.onDeleteAction(nodeId, actionId)}
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <AnimatePresence initial={false}>
        {!node.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <ChildrenSection parentId={nodeId} childIds={node.childIds} nodes={nodes} {...handlers} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableRow({ childId, nodes, ...handlers }: { childId: string; nodes: TreeNodes } & SharedHandlers) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: childId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <motion.div
        className="relative pl-5 pb-4"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <div className="absolute left-0 top-5 h-px w-5 bg-zinc-600" />
        <TreeRow
          nodeId={childId}
          nodes={nodes}
          dragListeners={listeners as Record<string, unknown>}
          dragAttributes={attributes as unknown as Record<string, unknown>}
          {...handlers}
        />
      </motion.div>
    </div>
  );
}

function ChildrenSection({ parentId, childIds, nodes, ...handlers }: { parentId: string; childIds: string[]; nodes: TreeNodes } & SharedHandlers) {
  const { activeId, ghostParentId, ghostInsertIndex, ghostKey } = useDragStore();

  // このセクションがゴーストを表示すべき唯一の場所かを確認
  const ghostNode = ghostParentId === parentId && activeId ? nodes[activeId] : null;

  // ghostInsertIndex: 挿入位置（null = 末尾）
  const insertAt = ghostNode !== null
    ? (ghostInsertIndex !== null ? ghostInsertIndex : childIds.length)
    : -1;

  // ghostKey をキーに含めることで、ゴーストが別の場所に移動した際に必ず再マウントされ
  // 古いゴーストが残らないことを保証する
  const ghostElementKey = `__ghost__${ghostKey}`;

  // childIds とゴーストを正しい位置に混ぜてレンダリング
  const rows: React.ReactNode[] = [];
  childIds.forEach((childId, i) => {
    if (ghostNode && insertAt === i) {
      rows.push(<GhostCard key={ghostElementKey} node={ghostNode} />);
    }
    rows.push(<SortableRow key={childId} childId={childId} nodes={nodes} {...handlers} />);
  });
  if (ghostNode && insertAt >= childIds.length) {
    rows.push(<GhostCard key={ghostElementKey} node={ghostNode} />);
  }

  return (
    <div className="ml-6 mt-3 border-l border-zinc-600">
      <FirstChildZone parentId={parentId} />

      <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
        <AnimatePresence>
          {rows}
        </AnimatePresence>
      </SortableContext>

      <div className="relative pl-5 pb-4">
        <div className="absolute left-0 top-5 h-px w-5 bg-zinc-600" />
        <div className="absolute -left-px top-5 bottom-0 w-0.5 bg-zinc-950" />
        <AddRow onAdd={(title) => handlers.onAddChild(parentId, title)} />
      </div>
    </div>
  );
}

interface TreeViewProps extends SharedHandlers {
  rootId: string;
  nodes: TreeNodes;
}

export function TreeView({ rootId, nodes, ...handlers }: TreeViewProps) {
  const root = nodes[rootId];
  if (!root) return null;

  const { activeId, setDragState, resetDragState } = useDragStore();
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpandTimer = () => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
  };

  const reset = () => {
    resetDragState();
    clearExpandTimer();
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDragState({ activeId: active.id as string, targetId: null, ghostParentId: null, ghostInsertIndex: null });
    clearExpandTimer();
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    clearExpandTimer();

    if (!over) {
      setDragState({ targetId: null, ghostParentId: null, ghostInsertIndex: null });
      return;
    }

    const overId = over.id as string;

    // ゾーンID (先頭挿入用)
    if (isTopZone(overId)) {
      const zoneParentId = getZoneParentId(overId);
      setDragState({ targetId: null, ghostParentId: zoneParentId, ghostInsertIndex: 0 });
      return;
    }

    const activeNode = nodes[active.id as string];
    const overNode = nodes[overId];
    if (!activeNode || !overNode) return;

    const xDelta = (active.rect.current.translated?.left ?? 0) - over.rect.left;
    const target = resolveTarget(overId, xDelta, nodes);

    if (!target || target.parentId === activeNode.parentId) {
      // 同じ親内の並び替え: SortableがVisualを担当するのでゴースト不要
      setDragState({ targetId: null, ghostParentId: null, ghostInsertIndex: null });
    } else {
      setDragState({
        targetId: xDelta > 20 ? overId : null,
        ghostParentId: target.parentId,
        ghostInsertIndex: target.insertIndex ?? null,
      });
    }

    if (overNode.collapsed) {
      expandTimerRef.current = setTimeout(() => {
        handlers.onToggleCollapsed(overId);
        expandTimerRef.current = null;
      }, 600);
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    reset();

    if (!over || active.id === over.id) return;

    const overId = over.id as string;

    // ゾーンID (先頭挿入)
    if (isTopZone(overId)) {
      const zoneParentId = getZoneParentId(overId);
      const activeNode = nodes[active.id as string];
      if (!activeNode) return;

      if (activeNode.parentId === zoneParentId) {
        const parent = nodes[zoneParentId];
        const oldIndex = parent?.childIds.indexOf(active.id as string) ?? -1;
        if (oldIndex > 0) {
          handlers.onReorderChildren(zoneParentId, oldIndex, 0);
        }
      } else {
        handlers.onMoveNode(active.id as string, zoneParentId, 0);
      }
      return;
    }

    const activeNode = nodes[active.id as string];
    const overNode = nodes[overId];
    if (!activeNode || !overNode) return;

    const xDelta = (active.rect.current.translated?.left ?? 0) - over.rect.left;
    const target = resolveTarget(overId, xDelta, nodes);
    if (!target) return;

    if (target.parentId === activeNode.parentId) {
      // 同じ親内での並び替え
      const parent = nodes[activeNode.parentId!];
      if (!parent) return;
      const oldIndex = parent.childIds.indexOf(active.id as string);
      const newIndex = target.insertIndex ?? parent.childIds.length - 1;
      if (oldIndex !== -1 && oldIndex !== newIndex) {
        handlers.onReorderChildren(activeNode.parentId!, oldIndex, newIndex);
      }
    } else {
      handlers.onMoveNode(active.id as string, target.parentId, target.insertIndex);
    }
  };

  const activeNode = activeId ? nodes[activeId] : null;

  return (
    <DndContext
      collisionDetection={treeCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
    >
      <div>
        <NodeCard
          node={root}
          isRoot
          isLeaf={root.childIds.length === 0}
          hasChildren={root.childIds.length > 0}
          collapsed={root.collapsed}
          onUpdate={(title) => handlers.onUpdate(rootId, title)}
          onToggle={() => handlers.onToggle(rootId)}
          onDelete={() => {}}
          onCategoryChange={(cat) => handlers.onCategoryChange(rootId, cat)}
          onToggleCollapse={() => handlers.onToggleCollapsed(rootId)}
          onAddAction={() => handlers.onAddAction(rootId)}
          onUpdateAction={(actionId, content) => handlers.onUpdateAction(rootId, actionId, content)}
          onDeleteAction={(actionId) => handlers.onDeleteAction(rootId, actionId)}
        />
        <AnimatePresence initial={false}>
          {!root.collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <ChildrenSection parentId={rootId} childIds={root.childIds} nodes={nodes} {...handlers} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DragOverlay>
        {activeNode ? (
          <div className="opacity-90 rotate-1 shadow-2xl">
            <NodeCard
              node={activeNode}
              isLeaf={activeNode.childIds.length === 0}
              hasChildren={activeNode.childIds.length > 0}
              collapsed={activeNode.collapsed}
              onUpdate={() => {}} onToggle={() => {}} onDelete={() => {}}
              onCategoryChange={() => {}} onToggleCollapse={() => {}}
              onAddAction={() => {}} onUpdateAction={() => {}} onDeleteAction={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
