import { Trash2, ChevronDown } from 'lucide-react'
import { cn } from '../utils'
import type { GoalNode, NodeCategory } from '../types'

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
}

export function NodeCard({ node, isRoot, isLeaf, hasChildren, collapsed, onUpdate, onToggle, onDelete, onCategoryChange, onToggleCollapse }: Props) {
  const locked = node.completed

  return (
    <div
      className={cn(
        'group flex flex-col border rounded-xl w-120 transition-colors duration-150',
        isRoot
          ? 'bg-zinc-800/80 border-zinc-700'
          : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700',
        locked && 'opacity-40',
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        {/* Toggle — always interactive */}
        <button
          onClick={onToggle}
          className={cn(
            'relative shrink-0 mt-1 w-10 h-6 rounded-full flex items-center transition-all duration-200',
            locked ? 'bg-indigo-500 justify-end pr-0.5' : 'bg-zinc-700 justify-start pl-0.5',
          )}
        >
          <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
        </button>

        {/* Textarea — disabled when locked */}
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
          {/* Collapse toggle */}
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

          {/* Delete — hidden when locked */}
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

      {/* Category selector — leaf nodes only, disabled when locked */}
      {isLeaf && !isRoot && (
        <div className={cn('flex border-t border-zinc-700/50 divide-x divide-zinc-700/50', locked && 'pointer-events-none')}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(node.category === cat ? null : cat)}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium transition-colors duration-150 first:rounded-bl-xl last:rounded-br-xl',
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
    </div>
  )
}
