import {useState, useCallback} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {getTasksWithTags, getUserMedals, completeTask, getPendingInvitations, getUserTags} from '@/db/api'
import type {Task, Medal, Tag} from '@/db/types'
import Taro, {useDidShow} from '@tarojs/taro'
import MedalCard from '@/components/MedalCard'
import TaskCard from '@/components/TaskCard'
import MedalModal from '@/components/MedalModal'
import RouteGuard from '@/components/RouteGuard'

function HomePage() {
  const {user} = useAuth()
  const [medals, setMedals] = useState<Medal[]>([])
  const [incompleteTasks, setIncompleteTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedMedal, setSelectedMedal] = useState<Medal | null>(null)
  const [showMedalModal, setShowMedalModal] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  
  // 标签筛选相关
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [showTagFilter, setShowTagFilter] = useState(false)

  // 加载核心数据（勋章和未完成任务）
  const loadCoreData = useCallback(async () => {
    if (!user) return

    try {
      // 只加载最近的5个勋章和未完成任务，提高首屏加载速度
      const [medalsData, incompleteData, tags] = await Promise.all([
        getUserMedals(user.id, 5), // 限制只加载5个勋章
        getTasksWithTags(user.id, false, selectedTagIds.length > 0 ? selectedTagIds : undefined),
        getUserTags(user.id)
      ])

      setMedals(medalsData)
      setIncompleteTasks(incompleteData)
      setAvailableTags(tags)
    } catch (error) {
      console.error('加载核心数据失败:', error)
      Taro.showToast({title: '加载数据失败', icon: 'none'})
    }
  }, [user, selectedTagIds])

  // 加载次要数据（已完成任务和邀请数量）
  const loadSecondaryData = useCallback(async () => {
    if (!user) return

    try {
      const [completedData, invitations] = await Promise.all([
        getTasksWithTags(user.id, true, selectedTagIds.length > 0 ? selectedTagIds : undefined),
        getPendingInvitations(user.id)
      ])

      setCompletedTasks(completedData)
      setPendingCount(invitations.length)
    } catch (error) {
      console.error('加载次要数据失败:', error)
    }
  }, [user, selectedTagIds])

  useDidShow(() => {
    // 先加载核心数据
    loadCoreData()
    // 延迟加载次要数据
    setTimeout(() => {
      loadSecondaryData()
    }, 500)
  })

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return

    Taro.showLoading({title: '处理中...'})

    try {
      const result = await completeTask(taskId, user.id)

      if (!result.success) {
        Taro.hideLoading()
        Taro.showToast({title: result.error || '完成任务失败', icon: 'none'})
        return
      }

      Taro.hideLoading()

      // 显示勋章弹窗
      if (result.medal) {
        setSelectedMedal(result.medal)
        setShowMedalModal(true)
      }

      // 重新加载核心数据
      await loadCoreData()
      // 延迟加载次要数据
      setTimeout(() => {
        loadSecondaryData()
      }, 500)
    } catch (error) {
      Taro.hideLoading()
      console.error('完成任务失败:', error)
      Taro.showToast({title: '完成任务失败', icon: 'none'})
    }
  }

  const handleEditTask = (taskId: string) => {
    Taro.navigateTo({url: `/pages/task-form/index?id=${taskId}`})
  }

  const handleAddTask = () => {
    Taro.navigateTo({url: '/pages/task-form/index'})
  }

  const handleMedalClick = (medal: Medal) => {
    Taro.navigateTo({url: `/pages/medal-detail/index?id=${medal.id}`})
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-3xl text-foreground mb-4">请先登录</div>
          <button
            type="button"
            className="px-8 py-4 bg-gradient-primary rounded-lg text-2xl font-bold text-primary-foreground flex items-center justify-center leading-none"
            onClick={() => Taro.navigateTo({url: '/pages/login/index'})}>
            前往登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 勋章墙区域 */}
      <div className="bg-gradient-card px-6 py-8">
        <div className="text-3xl font-bold text-foreground mb-6">我的勋章</div>
        {medals.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {medals.map((medal) => (
              <MedalCard 
                key={medal.id} 
                medal={medal} 
                onClick={() => handleMedalClick(medal)}
                showShareButton={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="i-mdi-medal-outline text-6xl text-muted-foreground mb-4" />
            <div className="text-xl text-muted-foreground">完成你的第一个任务，解锁专属勋章</div>
          </div>
        )}
      </div>

      {/* 未完成任务列表 */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-bold text-foreground">待办任务</div>
          <div className="flex items-center gap-3">
            {/* 标签管理入口 */}
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-muted"
              onClick={() => Taro.navigateTo({url: '/pages/tag-manager/index'})}>
              <div className="i-mdi-tag-multiple text-3xl text-primary" />
            </button>
            <div className="flex items-center gap-2 text-xl text-muted-foreground">
              <div className="i-mdi-format-list-checks text-2xl" />
              <span>{incompleteTasks.length}</span>
            </div>
          </div>
        </div>

        {/* 标签筛选 */}
        {availableTags.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              className="flex items-center gap-2 text-lg text-primary mb-3"
              onClick={() => setShowTagFilter(!showTagFilter)}>
              <div className={`i-mdi-filter text-2xl transition-transform ${showTagFilter ? 'rotate-180' : ''}`} />
              <span>按标签筛选</span>
              {selectedTagIds.length > 0 && (
                <span className="px-2 py-1 bg-primary/20 rounded-full text-sm">
                  {selectedTagIds.length}
                </span>
              )}
            </button>

            {showTagFilter && (
              <div className="flex flex-wrap gap-2 p-4 bg-card rounded-lg border-2 border-input">
                <button
                  type="button"
                  className={`px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    selectedTagIds.length === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedTagIds([])}>
                  全部
                </button>
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? 'ring-2 ring-primary'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : tag.color + '20',
                      color: selectedTagIds.includes(tag.id) ? '#fff' : tag.color,
                      border: `1px solid ${tag.color}`
                    }}
                    onClick={() => {
                      if (selectedTagIds.includes(tag.id)) {
                        setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))
                      } else {
                        setSelectedTagIds([...selectedTagIds, tag.id])
                      }
                    }}>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {incompleteTasks.length > 0 ? (
          <div>
            {incompleteTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => handleCompleteTask(task.id)}
                onEdit={() => handleEditTask(task.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg">
            <div className="i-mdi-checkbox-marked-circle-outline text-6xl text-muted-foreground mb-4" />
            <div className="text-xl text-muted-foreground">暂无待办任务</div>
          </div>
        )}
      </div>

      {/* 已完成任务列表 */}
      {completedTasks.length > 0 && (
        <div className="px-6 pb-8">
          <div
            className="flex items-center justify-between mb-6"
            onClick={() => setShowCompleted(!showCompleted)}>
            <div className="text-3xl font-bold text-foreground">已完成</div>
            <div className="flex items-center gap-2">
              <span className="text-xl text-muted-foreground">{completedTasks.length}</span>
              <div
                className={`i-mdi-chevron-down text-3xl text-muted-foreground transition-transform ${
                  showCompleted ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {showCompleted && (
            <div>
              {completedTasks.map((task) => (
                <div key={task.id} className="bg-card rounded-lg p-6 mb-4 opacity-60">
                  <div className="text-2xl font-bold text-foreground mb-2">{task.title}</div>
                  {task.completed_at && (
                    <div className="text-lg text-muted-foreground">
                      完成于 {new Date(task.completed_at).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 添加任务按钮 */}
      <div className="fixed right-6 bottom-24 w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-elegant" onClick={handleAddTask}>
        <div className="i-mdi-plus text-5xl text-primary-foreground" />
      </div>

      {/* 协作邀请通知按钮 */}
      {pendingCount > 0 && (
        <div
          className="fixed right-6 bottom-44 w-16 h-16 bg-destructive rounded-full flex items-center justify-center shadow-elegant relative"
          onClick={() => Taro.navigateTo({url: '/pages/invitations/index'})}>
          <div className="i-mdi-email text-4xl text-white" />
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
            <span className="text-base text-white font-bold">{pendingCount}</span>
          </div>
        </div>
      )}

      {/* 勋章弹窗 */}
      <MedalModal medal={selectedMedal} visible={showMedalModal} onClose={() => setShowMedalModal(false)} />
    </div>
  )
}

export default function Home() {
  return (
    <RouteGuard>
      <HomePage />
    </RouteGuard>
  )
}
