import {useState, useEffect, useCallback} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {createTask, updateTask, getTaskById, deleteTask, addTaskCollaborator, getTaskCollaborators, getUserTags, getTaskTags, setTaskTags, createTag} from '@/db/api'
import type {TaskDifficulty, Tag} from '@/db/types'
import Taro, {getCurrentInstance, getEnv} from '@tarojs/taro'
import {Picker} from '@tarojs/components'
import RouteGuard from '@/components/RouteGuard'
import CollaboratorManager from '@/components/CollaboratorManager'
import TaskComments from '@/components/TaskComments'
import TagSelector from '@/components/TagSelector'
import ColorPicker from '@/components/ColorPicker'

function TaskFormPage() {
  const {user} = useAuth()
  const instance = getCurrentInstance()
  const taskId = instance.router?.params?.id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState(60)  // 默认提前60分钟
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [taskOwnerId, setTaskOwnerId] = useState('')
  const [enableCollaboration, setEnableCollaboration] = useState(false)
  const [selectedCollaborators, setSelectedCollaborators] = useState<Array<{userId: string; role: 'viewer' | 'editor'}>>([])
  
  // 标签相关状态
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [showCreateTagModal, setShowCreateTagModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')

  const isWeApp = getEnv() === 'WEAPP'

  const formatDateTimeForInput = useCallback((date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }, [])

  const loadTask = useCallback(async () => {
    if (!taskId) return

    const task = await getTaskById(taskId)
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDeadline(formatDateTimeForInput(new Date(task.deadline)))
      setDifficulty(task.difficulty)
      setEstimatedHours(task.estimated_hours?.toString() || '')
      setReminderEnabled(task.reminder_enabled || false)
      setReminderTime(task.reminder_time || 60)
      setTaskOwnerId(task.user_id)
      
      // 加载任务的标签
      const taskTags = await getTaskTags(taskId)
      setSelectedTagIds(taskTags.map(tag => tag.id))
      
      // 检查是否有协作者，如果有则自动启用协作
      const collaborators = await getTaskCollaborators(taskId)
      if (collaborators.length > 0) {
        setEnableCollaboration(true)
      }
    }
  }, [taskId, formatDateTimeForInput])

  // 加载用户的所有标签
  const loadTags = useCallback(async () => {
    if (!user) return
    const tags = await getUserTags(user.id)
    setAvailableTags(tags)
  }, [user])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  useEffect(() => {
    if (taskId) {
      setIsEdit(true)
      loadTask()
    } else {
      // 设置默认截止时间为明天
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(18, 0, 0, 0)
      setDeadline(formatDateTimeForInput(tomorrow))
    }
  }, [taskId, loadTask, formatDateTimeForInput])

  const handleSave = async () => {
    if (!user) {
      Taro.showToast({title: '请先登录', icon: 'none'})
      return
    }

    if (!title.trim()) {
      Taro.showToast({title: '请填写事务标题', icon: 'none'})
      return
    }

    if (!deadline) {
      Taro.showToast({title: '请选择截止时间', icon: 'none'})
      return
    }

    // 检查截止时间是否已过
    const deadlineDate = new Date(deadline)
    const now = new Date()
    if (deadlineDate < now) {
      const confirmed = await new Promise<boolean>((resolve) => {
        Taro.showModal({
          title: '提示',
          content: '截止时间已过，是否仍要保存？',
          success: (res) => resolve(res.confirm)
        })
      })
      if (!confirmed) return
    }

    setLoading(true)

    try {
      // 如果启用提醒且在微信小程序环境，请求订阅消息权限
      let subscriptionId: string | undefined
      if (reminderEnabled && isWeApp) {
        // 从环境变量读取模板ID
        const tmplId = process.env.TARO_APP_WECHAT_REMINDER_TEMPLATE_ID || ''
        
        if (!tmplId || tmplId === 'YOUR_TEMPLATE_ID') {
          Taro.showToast({
            title: '未配置订阅消息模板ID，请查看REMINDER_SETUP.md',
            icon: 'none',
            duration: 3000
          })
        } else {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await (Taro.requestSubscribeMessage as any)({
              tmplIds: [tmplId]
            }) as {[key: string]: string}
            
            if (res[tmplId] === 'accept') {
              subscriptionId = tmplId
              Taro.showToast({title: '已开启提醒', icon: 'success', duration: 1500})
            } else {
              Taro.showToast({title: '未授权提醒，将不会发送通知', icon: 'none', duration: 2000})
            }
          } catch (err) {
            console.error('请求订阅消息失败:', err)
            Taro.showToast({title: '提醒设置失败', icon: 'none', duration: 1500})
          }
        }
      }

      const taskData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        deadline: new Date(deadline).toISOString(),
        difficulty,
        estimated_hours: estimatedHours ? Number.parseFloat(estimatedHours) : undefined,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        reminder_sent: false,
        subscription_id: subscriptionId
      }

      if (isEdit && taskId) {
        await updateTask(taskId, taskData)
        // 更新任务标签
        await setTaskTags(taskId, selectedTagIds)
        Taro.showToast({title: '更新成功', icon: 'success'})
      } else {
        // 创建任务
        const newTask = await createTask(taskData)
        
        // 设置任务标签
        if (newTask && selectedTagIds.length > 0) {
          await setTaskTags(newTask.id, selectedTagIds)
        }
        
        // 如果启用协作且有选中的协作者，批量添加
        if (enableCollaboration && selectedCollaborators.length > 0 && newTask) {
          try {
            await Promise.all(
              selectedCollaborators.map(collab =>
                addTaskCollaborator(newTask.id, collab.userId, collab.role, user.id)
              )
            )
            Taro.showToast({
              title: `创建成功，已邀请${selectedCollaborators.length}位协作者`,
              icon: 'success',
              duration: 2000
            })
          } catch (error) {
            console.error('添加协作者失败:', error)
            Taro.showToast({title: '任务创建成功，但部分协作者邀请失败', icon: 'none', duration: 2000})
          }
        } else {
          Taro.showToast({title: '创建成功', icon: 'success'})
        }
      }

      setTimeout(() => {
        Taro.navigateBack()
      }, 500)
    } catch (error) {
      console.error('保存任务失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!taskId) return

    const confirmed = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个任务吗？',
        success: (res) => resolve(res.confirm)
      })
    })

    if (!confirmed) return

    setLoading(true)

    try {
      await deleteTask(taskId)
      Taro.showToast({title: '删除成功', icon: 'success'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 500)
    } catch (error) {
      console.error('删除任务失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!user || !newTagName.trim()) {
      Taro.showToast({title: '请输入标签名称', icon: 'none'})
      return
    }

    try {
      const newTag = await createTag(user.id, newTagName.trim(), newTagColor)
      if (newTag) {
        setAvailableTags([...availableTags, newTag])
        setSelectedTagIds([...selectedTagIds, newTag.id])
        setShowCreateTagModal(false)
        setNewTagName('')
        setNewTagColor('#3B82F6')
        Taro.showToast({title: '创建成功', icon: 'success'})
      }
    } catch (error: any) {
      console.error('创建标签失败:', error)
      Taro.showToast({title: error.message || '创建失败', icon: 'none'})
    }
  }

  const handleDateChange = (e: {detail: {value: string}}) => {
    const date = e.detail.value
    const time = deadline.split(' ')[1] || '18:00'
    setDeadline(`${date} ${time}`)
  }

  const handleTimeChange = (e: {detail: {value: string}}) => {
    const time = e.detail.value
    const date = deadline.split(' ')[0] || formatDateTimeForInput(new Date()).split(' ')[0]
    setDeadline(`${date} ${time}`)
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      {/* 标题输入 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl text-foreground font-bold">事务标题</span>
          <span className="text-destructive text-2xl">*</span>
        </div>
        <div className="border-2 border-input rounded-lg px-4 py-4 bg-background overflow-hidden">
          <input
            className="w-full text-xl text-foreground bg-transparent outline-none"
            type="text"
            placeholder="请输入事务标题（最多50字）"
            maxLength={50}
            value={title}
            onInput={(e) => {
              const ev = e as unknown
              setTitle((ev as {detail?: {value?: string}}).detail?.value ?? (ev as {target?: {value?: string}}).target?.value ?? '')
            }}
          />
        </div>
      </div>

      {/* 详细描述 */}
      <div className="mb-6">
        <div className="text-2xl text-foreground font-bold mb-3">详细描述</div>
        <div className="border-2 border-input rounded-lg px-4 py-4 bg-background overflow-hidden">
          <textarea
            className="w-full text-xl text-foreground bg-transparent outline-none"
            placeholder="请输入详细描述（最多200字）"
            maxLength={200}
            rows={4}
            value={description}
            onInput={(e) => {
              const ev = e as unknown
              setDescription((ev as {detail?: {value?: string}}).detail?.value ?? (ev as {target?: {value?: string}}).target?.value ?? '')
            }}
          />
        </div>
      </div>

      {/* 截止日期 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl text-foreground font-bold">截止日期</span>
          <span className="text-destructive text-2xl">*</span>
        </div>
        <div className="flex gap-3">
          <Picker mode="date" value={deadline.split(' ')[0]} onChange={handleDateChange}>
            <div className="flex-1 border-2 border-input rounded-lg px-4 py-4 bg-background">
              <div className="text-xl text-foreground">{deadline.split(' ')[0] || '选择日期'}</div>
            </div>
          </Picker>
          <Picker mode="time" value={deadline.split(' ')[1]} onChange={handleTimeChange}>
            <div className="flex-1 border-2 border-input rounded-lg px-4 py-4 bg-background">
              <div className="text-xl text-foreground">{deadline.split(' ')[1] || '选择时间'}</div>
            </div>
          </Picker>
        </div>
      </div>

      {/* 任务难度 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl text-foreground font-bold">任务难度</span>
          <span className="text-destructive text-2xl">*</span>
        </div>
        <div className="flex gap-3">
          {(['easy', 'medium', 'hard'] as TaskDifficulty[]).map((level) => {
            const labels = {easy: '简单', medium: '中等', hard: '困难'}
            const isSelected = difficulty === level
            return (
              <button
                key={level}
                type="button"
                className={`flex-1 py-4 rounded-lg text-xl font-bold transition-all border-2 flex items-center justify-center leading-none ${
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-input text-muted-foreground'
                }`}
                onClick={() => setDifficulty(level)}>
                {labels[level]}
              </button>
            )
          })}
        </div>
      </div>

      {/* 预估耗时 */}
      <div className="mb-6">
        <div className="text-2xl text-foreground font-bold mb-3">预估耗时（小时）</div>
        <div className="border-2 border-input rounded-lg px-4 py-4 bg-background overflow-hidden">
          <input
            className="w-full text-xl text-foreground bg-transparent outline-none"
            type="number"
            placeholder="请输入预估耗时"
            value={estimatedHours}
            onInput={(e) => {
              const ev = e as unknown
              setEstimatedHours((ev as {detail?: {value?: string}}).detail?.value ?? (ev as {target?: {value?: string}}).target?.value ?? '')
            }}
          />
        </div>
      </div>

      {/* 标签选择 */}
      <div className="mb-6">
        <div className="text-2xl text-foreground font-bold mb-3">任务标签</div>
        <TagSelector
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          onTagsChange={setSelectedTagIds}
          onCreateTag={() => setShowCreateTagModal(true)}
        />
      </div>

      {/* 提醒设置 */}
      <div className="mb-8">
        <div className="text-2xl text-foreground font-bold mb-3">截止提醒</div>
        
        {/* 是否启用提醒 */}
        <div 
          className="flex items-center justify-between mb-4 p-4 border-2 border-input rounded-lg bg-background cursor-pointer"
          onClick={() => setReminderEnabled(!reminderEnabled)}>
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              reminderEnabled ? 'bg-primary border-primary' : 'border-input'
            }`}>
              {reminderEnabled && <div className="i-mdi-check text-2xl text-white" />}
            </div>
            <span className="text-xl text-foreground">启用截止提醒</span>
          </div>
          {!isWeApp && (
            <span className="text-base text-muted-foreground">仅小程序可用</span>
          )}
        </div>

        {/* 提醒时间选择 */}
        {reminderEnabled && (
          <div className="pl-4">
            <div className="text-lg text-muted-foreground mb-3">提前提醒时间</div>
            <div className="flex gap-3">
              {[30, 60, 120, 1440].map((minutes) => {
                const labels = {30: '30分钟', 60: '1小时', 120: '2小时', 1440: '1天'}
                const isSelected = reminderTime === minutes
                return (
                  <button
                    key={minutes}
                    type="button"
                    className={`flex-1 py-3 rounded-lg text-lg font-bold transition-all border-2 flex items-center justify-center leading-none ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-input text-muted-foreground'
                    }`}
                    onClick={() => setReminderTime(minutes)}>
                    {labels[minutes as keyof typeof labels]}
                  </button>
                )
              })}
            </div>
            {isWeApp && (
              <div className="mt-3 text-base text-muted-foreground">
                保存时将请求微信订阅消息权限
              </div>
            )}
          </div>
        )}
      </div>

      {/* 协作功能 */}
      <div className="mb-8">
        <div className="text-2xl text-foreground font-bold mb-3">多人协作</div>
        
        {/* 是否启用协作 */}
        <div 
          className="flex items-center justify-between mb-4 p-4 border-2 border-input rounded-lg bg-background cursor-pointer"
          onClick={() => setEnableCollaboration(!enableCollaboration)}>
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              enableCollaboration ? 'bg-primary border-primary' : 'border-input'
            }`}>
              {enableCollaboration && <div className="i-mdi-check text-2xl text-white" />}
            </div>
            <span className="text-xl text-foreground">启用多人协作</span>
          </div>
        </div>

        {/* 协作者管理 */}
        {enableCollaboration && user && (
          <div className="pl-4">
            <CollaboratorManager
              taskId={taskId}
              taskOwnerId={taskOwnerId || user.id}
              currentUserId={user.id}
              onCollaboratorsChange={setSelectedCollaborators}
            />
          </div>
        )}
      </div>

      {/* 留言区域（仅编辑模式显示） */}
      {isEdit && taskId && user && (
        <div className="mb-6">
          <TaskComments taskId={taskId} currentUserId={user.id} />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col gap-4">
        <button
          type="button"
          className={`w-full py-4 rounded-lg text-2xl font-bold flex items-center justify-center leading-none ${
            loading ? 'bg-primary/50' : 'bg-gradient-primary shadow-elegant'
          }`}
          onClick={handleSave}
          disabled={loading}>
          {loading ? '保存中...' : '保存'}
        </button>

        {isEdit && (
          <button
            type="button"
            className="w-full py-4 rounded-lg text-2xl font-bold border-2 border-destructive text-destructive flex items-center justify-center leading-none"
            onClick={handleDelete}
            disabled={loading}>
            删除任务
          </button>
        )}

        <button
          type="button"
          className="w-full py-4 rounded-lg text-2xl font-bold border-2 border-input text-muted-foreground flex items-center justify-center leading-none"
          onClick={() => Taro.navigateBack()}
          disabled={loading}>
          取消
        </button>
      </div>

      {/* 创建标签弹窗 */}
      {showCreateTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <div className="text-3xl font-bold text-foreground mb-6">创建标签</div>

            <div className="space-y-6">
              {/* 标签名称 */}
              <div>
                <div className="text-lg text-foreground mb-2">标签名称</div>
                <div className="border-2 border-input rounded-lg px-4 py-3 bg-background">
                  <input
                    className="w-full text-xl text-foreground bg-transparent outline-none"
                    placeholder="输入标签名称"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>

              {/* 颜色选择 */}
              <div>
                <div className="text-lg text-foreground mb-3">选择颜色</div>
                <ColorPicker
                  selectedColor={newTagColor}
                  onColorSelect={setNewTagColor}
                />
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                className="flex-1 py-3 border-2 border-input rounded-lg text-xl font-bold text-foreground flex items-center justify-center leading-none"
                onClick={() => {
                  setShowCreateTagModal(false)
                  setNewTagName('')
                  setNewTagColor('#3B82F6')
                }}>
                取消
              </button>
              <button
                type="button"
                className="flex-1 py-3 bg-gradient-primary rounded-lg text-xl font-bold text-primary-foreground flex items-center justify-center leading-none"
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TaskForm() {
  return (
    <RouteGuard>
      <TaskFormPage />
    </RouteGuard>
  )
}
