import type {Tag} from '@/db/types'

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function TagBadge({tag, onRemove, size = 'md'}: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} font-medium`}
      style={{
        backgroundColor: tag.color + '20',
        color: tag.color,
        border: `1px solid ${tag.color}`
      }}>
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          className="flex items-center justify-center leading-none hover:opacity-70"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}>
          <div className="i-mdi-close text-base" />
        </button>
      )}
    </div>
  )
}
