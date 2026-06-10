import {useState, useCallback, useMemo} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {getUserTasks, getTasksByDate} from '@/db/api'
import type {Task} from '@/db/types'
import Taro, {useDidShow} from '@tarojs/taro'
import RouteGuard from '@/components/RouteGuard'

function TimeViewPage() {
  const {user} = useAuth()
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([])

  const loadTasks = useCallback(async () => {
    if (!user) return

    const allTasks = await getUserTasks(user.id)
    setTasks(allTasks)
  }, [user])

  useDidShow(() => {
    loadTasks()
  })

  // 生成日历数据
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: Array<{date: string; day: number; taskCount: number; isCurrentMonth: boolean}> = []

    // 填充上个月的日期
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(prevMonthLastDay - i).padStart(2, '0')}`,
        day: prevMonthLastDay - i,
        taskCount: 0,
        isCurrentMonth: false
      })
    }

    // 填充当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const taskCount = tasks.filter((task) => {
        const taskDate = new Date(task.deadline)
        return (
          taskDate.getFullYear() === year &&
          taskDate.getMonth() === month &&
          taskDate.getDate() === day
        )
      }).length

      days.push({
        date: dateStr,
        day,
        taskCount,
        isCurrentMonth: true
      })
    }

    // 填充下个月的日期
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: `${year}-${String(month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        taskCount: 0,
        isCurrentMonth: false
      })
    }

    return days
  }, [currentMonth, tasks])

  const handleDateClick = async (dateStr: string) => {
    if (!user) return

    setSelectedDate(dateStr)
    const dateTasks = await getTasksByDate(user.id, dateStr)
    setSelectedDateTasks(dateTasks)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({url: `/pages/task-form/index?id=${taskId}`})
  }

  // 时间轴数据
  const timelineData = useMemo(() => {
    const now = new Date()
    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    )

    return sortedTasks.map((task) => {
      const deadline = new Date(task.deadline)
      const isOverdue = deadline < now && !task.is_completed
      const status: 'pending' | 'overdue' | 'completed' = task.is_completed ? 'completed' : isOverdue ? 'overdue' : 'pending'

      return {
        ...task,
        status
      }
    })
  }, [tasks])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-3xl text-foreground mb-4">请先登录</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* 视图切换 */}
      <div className="bg-card px-6 py-6 flex gap-4">
        <button
          type="button"
          className={`flex-1 py-3 rounded-lg text-xl font-bold transition-all flex items-center justify-center leading-none ${
            viewMode === 'calendar' ? 'bg-gradient-primary text-primary-foreground' : 'border-2 border-input text-muted-foreground'
          }`}
          onClick={() => setViewMode('calendar')}>
          日历视图
        </button>
        <button
          type="button"
          className={`flex-1 py-3 rounded-lg text-xl font-bold transition-all flex items-center justify-center leading-none ${
            viewMode === 'timeline' ? 'bg-gradient-primary text-primary-foreground' : 'border-2 border-input text-muted-foreground'
          }`}
          onClick={() => setViewMode('timeline')}>
          时间轴视图
        </button>
      </div>

      {/* 日历视图 */}
      {viewMode === 'calendar' && (
        <div className="px-6 py-6">
          {/* 月份选择 */}
          <div className="flex items-center justify-between mb-6">
            <button type="button" className="p-2" onClick={handlePrevMonth}>
              <div className="i-mdi-chevron-left text-4xl text-foreground" />
            </button>
            <div className="text-3xl font-bold text-foreground">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </div>
            <button type="button" className="p-2" onClick={handleNextMonth}>
              <div className="i-mdi-chevron-right text-4xl text-foreground" />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className="text-center text-xl text-muted-foreground font-bold">
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {calendarData.map((item, index) => (
              <div
                key={index}
                className={`aspect-square border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                  item.isCurrentMonth
                    ? 'border-input bg-card'
                    : 'border-transparent bg-muted/20'
                } ${item.taskCount > 0 ? 'border-primary' : ''}`}
                onClick={() => item.isCurrentMonth && handleDateClick(item.date)}>
                <div
                  className={`text-xl font-bold ${
                    item.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  {item.day}
                </div>
                {item.taskCount > 0 && (
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center mt-1">
                    {item.taskCount}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 选中日期的任务列表 */}
          {selectedDate && (
            <div className="bg-card rounded-lg p-6">
              <div className="text-2xl font-bold text-foreground mb-4">
                {selectedDate} 的任务
              </div>
              {selectedDateTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-background rounded-lg p-4 border-l-4 border-primary"
                      onClick={() => handleTaskClick(task.id)}>
                      <div className="text-xl font-bold text-foreground mb-2">{task.title}</div>
                      <div className="flex items-center gap-4 text-lg text-muted-foreground">
                        <span>{task.is_completed ? '已完成' : '未完成'}</span>
                        <span>难度：{task.difficulty === 'easy' ? '简单' : task.difficulty === 'medium' ? '中等' : '困难'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-xl text-muted-foreground py-8">暂无任务</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 时间轴视图 */}
      {viewMode === 'timeline' && (
        <div className="px-6 py-6">
          {timelineData.length > 0 ? (
            <div className="relative">
              {/* 时间轴线 */}
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-border" />

              {/* 任务节点 */}
              <div className="space-y-6">
                {timelineData.map((task) => {
                  const statusConfig = {
                    pending: {color: 'bg-medal-rare', text: '未完成'},
                    overdue: {color: 'bg-destructive', text: '已逾期'},
                    completed: {color: 'bg-muted', text: '已完成'}
                  }
                  const config = statusConfig[task.status]

                  return (
                    <div key={task.id} className="relative pl-16" onClick={() => handleTaskClick(task.id)}>
                      {/* 时间轴节点 */}
                      <div className={`absolute left-3 top-2 w-7 h-7 rounded-full ${config.color} border-4 border-background`} />

                      {/* 任务卡片 */}
                      <div className={`bg-card rounded-lg p-4 border-l-4 ${task.status === 'overdue' ? 'border-destructive' : 'border-primary'}`}>
                        <div className="text-xl font-bold text-foreground mb-2">{task.title}</div>
                        <div className="flex items-center gap-4 text-lg text-muted-foreground">
                          <span>{new Date(task.deadline).toLocaleString('zh-CN')}</span>
                          <span className={task.status === 'overdue' ? 'text-destructive font-bold' : ''}>
                            {config.text}
                          </span>
                        </div>
                        {task.estimated_hours && (
                          <div className="mt-2 text-lg text-muted-foreground">
                            预估耗时：{task.estimated_hours}小时
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="i-mdi-timeline-outline text-6xl text-muted-foreground mb-4" />
              <div className="text-xl text-muted-foreground">暂无任务，去添加第一个吧</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TimeView() {
  return (
    <RouteGuard>
      <TimeViewPage />
    </RouteGuard>
  )
}
