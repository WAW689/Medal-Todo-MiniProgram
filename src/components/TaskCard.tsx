import type {Task} from '@/db/types'
import TagBadge from './TagBadge'

interface TaskCardProps {
  task: Task
  onComplete?: () => void
  onEdit?: () => void
}

export default function TaskCard({task, onComplete, onEdit}: TaskCardProps) {
  const difficultyConfig = {
    easy: {text: '简单', color: 'text-medal-common'},
    medium: {text: '中等', color: 'text-medal-rare'},
    hard: {text: '困难', color: 'text-medal-epic'}
  }

  const config = difficultyConfig[task.difficulty]
  const deadline = new Date(task.deadline)
  const now = new Date()
  const isOverdue = deadline < now && !task.is_completed

  const formatDeadline = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  return (
    <div className="bg-card rounded-lg p-6 mb-4 border-l-4 border-primary">
      <div onClick={onEdit}>
        {/* 标题和难度 */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-foreground break-keep flex-1">{task.title}</div>
          <div className={`text-xl font-bold ${config.color} ml-4`}>{config.text}</div>
        </div>

        {/* 描述 */}
        {task.description && (
          <div className="text-lg text-muted-foreground mb-3 line-clamp-2">{task.description}</div>
        )}

        {/* 标签 */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {task.tags.map(tag => (
              <TagBadge key={tag.id} tag={tag} size="sm" />
            ))}
          </div>
        )}

        {/* 截止时间和预估耗时 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="i-mdi-clock-outline text-2xl text-muted-foreground" />
            <span className={`text-lg ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
              {formatDeadline(deadline)}
            </span>
          </div>
          {task.estimated_hours && (
            <div className="flex items-center gap-2">
              <div className="i-mdi-timer-outline text-2xl text-muted-foreground" />
              <span className="text-lg text-muted-foreground">{task.estimated_hours}小时</span>
            </div>
          )}
        </div>
      </div>

      {/* 完成按钮 */}
      {!task.is_completed && onComplete && (
        <button
          type="button"
          className="w-full py-3 bg-gradient-primary rounded-lg text-xl font-bold text-primary-foreground flex items-center justify-center leading-none shadow-elegant"
          onClick={onComplete}>
          完成任务
        </button>
      )}
    </div>
  )
}
