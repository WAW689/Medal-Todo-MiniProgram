import {useState, useCallback} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {getPendingInvitations, respondToInvitation} from '@/db/api'
import type {TaskCollaborator, Task, Profile} from '@/db/types'
import Taro, {useDidShow} from '@tarojs/taro'
import RouteGuard from '@/components/RouteGuard'

function InvitationsPage() {
  const {user} = useAuth()
  const [invitations, setInvitations] = useState<TaskCollaborator[]>([])
  const [loading, setLoading] = useState(false)

  const loadInvitations = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await getPendingInvitations(user.id)
      setInvitations(data)
    } catch (error) {
      console.error('加载邀请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadInvitations()
  })

  const handleRespond = async (invitationId: string, status: 'accepted' | 'declined') => {
    setLoading(true)
    try {
      await respondToInvitation(invitationId, status)
      Taro.showToast({
        title: status === 'accepted' ? '已接受邀请' : '已拒绝邀请',
        icon: 'success'
      })
      await loadInvitations()
    } catch (error) {
      console.error('响应邀请失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const getRoleText = (role: string) => {
    return role === 'editor' ? '共事' : '监督'
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单'
      case 'medium':
        return '中等'
      case 'hard':
        return '困难'
      default:
        return '未知'
    }
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const isOverdue = date < now

    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()

    return {
      text: `${month}月${day}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      isOverdue
    }
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
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="bg-gradient-card px-6 py-8">
        <div className="text-4xl font-bold text-foreground mb-2">协作邀请</div>
        <div className="text-xl text-muted-foreground">
          {invitations.length > 0 ? `${invitations.length} 条待处理邀请` : '暂无待处理邀请'}
        </div>
      </div>

      {/* 邀请列表 */}
      <div className="px-6 py-6">
        {loading && invitations.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">加载中...</div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12">
            <div className="i-mdi-email-open-outline text-8xl text-muted-foreground mb-4" />
            <div className="text-2xl text-muted-foreground mb-2">暂无待处理邀请</div>
            <div className="text-lg text-muted-foreground">
              当有人邀请你协作任务时，会显示在这里
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const task = invitation.tasks as Partial<Task>
              const inviter = invitation.inviter as Partial<Profile>
              const deadline = task?.deadline ? formatDeadline(task.deadline) : null

              return (
                <div
                  key={invitation.id}
                  className="border-2 border-input rounded-lg p-5 bg-card space-y-4">
                  {/* 邀请人信息 */}
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-input">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      {inviter?.avatar_url ? (
                        <img
                          src={inviter.avatar_url as string}
                          alt="头像"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="i-mdi-account text-3xl text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xl text-foreground font-bold">
                        {inviter?.nickname || inviter?.username || '未知用户'}
                      </div>
                      <div className="text-base text-muted-foreground">
                        邀请你协作任务
                      </div>
                    </div>
                  </div>

                  {/* 任务信息 */}
                  <div className="space-y-3">
                    <div className="text-2xl text-foreground font-bold">
                      {task?.title || '未知任务'}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* 难度 */}
                      <div className="flex items-center gap-2">
                        <div className="i-mdi-signal text-2xl text-muted-foreground" />
                        <span className="text-lg text-muted-foreground">
                          {getDifficultyText(task?.difficulty || '')}
                        </span>
                      </div>

                      {/* 截止时间 */}
                      {deadline && (
                        <div className="flex items-center gap-2">
                          <div className="i-mdi-clock-outline text-2xl text-muted-foreground" />
                          <span
                            className={`text-lg ${
                              deadline.isOverdue ? 'text-destructive' : 'text-muted-foreground'
                            }`}>
                            {deadline.text}
                          </span>
                        </div>
                      )}

                      {/* 角色 */}
                      <div className="flex items-center gap-2">
                        <div className="i-mdi-account-key text-2xl text-muted-foreground" />
                        <span className="text-lg text-primary font-bold">
                          {getRoleText(invitation.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      className="flex-1 py-3 bg-gradient-primary rounded-lg text-xl font-bold text-primary-foreground flex items-center justify-center leading-none"
                      onClick={() => handleRespond(invitation.id, 'accepted')}
                      disabled={loading}>
                      接受
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-3 border-2 border-input rounded-lg text-xl font-bold text-muted-foreground flex items-center justify-center leading-none"
                      onClick={() => handleRespond(invitation.id, 'declined')}
                      disabled={loading}>
                      拒绝
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Invitations() {
  return (
    <RouteGuard>
      <InvitationsPage />
    </RouteGuard>
  )
}
