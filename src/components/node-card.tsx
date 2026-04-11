import { Trash2, ChevronDown, Plus, X, GripVertical } from 'lucide-react'
import { cn } from '../utils'
import type { ActionRecord, GoalNode, NodeCategory } from '../types'
import { useDragStore } from '../stores'

const CATEGORIES: NonNullable<NodeCategory>[] = ['意識', '行動']

interface Props {
  node: GoalNode
  isRoot?: boolean
  isLeaf?: boolean
  hasChildren?: boolean
  collapsed?: boolean
  onUpdate: (title: string) => void
  onToggle: () => void
  onDelete: () => void
  onCategoryChange: (category: NodeCategory) => void
  onToggleCollapse: () => void
  onAddAction: () => void
  onUpdateAction: (actionId: string, content: string) => void
  onDeleteAction: (actionId: string) => void
  dragListeners?: Record<string, unknown>
  dragAttributes?: Record<string, unknown>
}

export function NodeCard({
  node, isRoot, isLeaf, hasChildren, collapsed,
  onUpdate, onToggle, onDelete, onCategoryChange, onToggleCollapse,
  onAddAction, onUpdateAction, onDeleteAction,
  dragListeners, dragAttributes,
}: Props) {
  const { targetId } = useDragStore()
  const isDropTarget = !isRoot && targetId === node.id
  const canComplete = node.category !== '意識'
  const locked = node.completed && canComplete
  const showActions = isLeaf && !isRoot && node.category === '意識'

  return (
    <div
      className={cn(
        'group flex flex-col border rounded-xl w-120 transition-colors duration-150',
        isRoot
          ? 'bg-zinc-800/80 border-zinc-700'
          : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700',
        isDropTarget && 'border-indigo-500/60 bg-indigo-500/5',
        locked && 'opacity-40 cursor-not-allowed',
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        {!isRoot && (
          <button
            {...(dragListeners as React.HTMLAttributes<HTMLButtonElement>)}
            {...(dragAttributes as React.HTMLAttributes<HTMLButtonElement>)}
            className="opacity-0 group-hover:opacity-100 shrink-0 mt-1.5 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={14} />
          </button>
        )}
        {canComplete ? (
          <button
            onClick={onToggle}
            className={cn(
              'relative shrink-0 mt-1 w-10 h-6 rounded-full flex items-center transition-all duration-200',
              locked ? 'bg-indigo-500 justify-end pr-0.5 cursor-not-allowed' : 'bg-zinc-700 justify-start pl-0.5',
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
          </button>
        ) : (
          <div className="shrink-0 mt-1 w-10 h-6 rounded-full bg-zinc-700 flex items-center pl-0.5 opacity-30 cursor-not-allowed">
            <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
          </div>
        )}

        <textarea
          value={node.title}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="目標を入力..."
          rows={2}
          disabled={locked}
          className={cn(
            'flex-1 min-w-0 bg-transparent text-sm leading-relaxed placeholder:text-zinc-600 field-sizing-content min-h-[2lh] disabled:pointer-events-none',
            isRoot ? 'text-zinc-100 font-medium' : 'text-zinc-300',
            locked && 'line-through',
          )}
        />

        <div className="flex items-center gap-0.5 mt-1 shrink-0">
          {hasChildren && (
            <button
              onClick={onToggleCollapse}
              className="text-zinc-600 hover:text-zinc-300 rounded-lg p-2 transition-colors"
            >
              <ChevronDown
                size={16}
                className={cn('transition-transform duration-200', collapsed && '-rotate-90')}
              />
            </button>
          )}
          {!isRoot && !locked && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-2"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category selector */}
      {isLeaf && !isRoot && (
        <div className={cn('flex border-t border-zinc-700/50 divide-x divide-zinc-700/50', locked && 'pointer-events-none')}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(node.category === cat ? null : cat)}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium transition-colors duration-150',
                !showActions && 'first:rounded-bl-xl last:rounded-br-xl',
                node.category === cat
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-zinc-600 hover:text-zinc-400',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Action records — 意識 nodes only */}
      {showActions && (
        <div className={cn('border-t border-zinc-700/50 px-3 py-2 flex flex-col gap-2', locked && 'pointer-events-none')}>
          {node.actions.map((action: ActionRecord, i) => (
            <div key={action.id} className="flex items-start gap-2 group/action">
              <span className="text-zinc-600 text-xs mt-1 shrink-0">•</span>
              <textarea
                value={action.content}
                onChange={(e) => onUpdateAction(action.id, e.target.value)}
                autoFocus={i === node.actions.length - 1 && action.content === ''}
                placeholder="意識して実行した行動..."
                rows={1}
                className="flex-1 min-w-0 bg-transparent text-sm text-zinc-300 leading-relaxed placeholder:text-zinc-600 field-sizing-content min-h-lh"
              />
              <button
                onClick={() => onDeleteAction(action.id)}
                className="opacity-0 group-hover/action:opacity-100 shrink-0 mt-0.5 text-zinc-600 hover:text-red-400 transition-all"
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={onAddAction}
            className="flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors w-full rounded-lg py-1 hover:bg-zinc-700/30"
          >
            <Plus size={13} />
            行動を追加
          </button>
        </div>
      )}
    </div>
  )
}
