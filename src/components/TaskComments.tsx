import {useState, useCallback, useEffect} from 'react'
import Taro from '@tarojs/taro'
import {getTaskComments, addTaskComment, deleteTaskComment} from '@/db/api'
import type {TaskComment, Profile} from '@/db/types'

interface TaskCommentsProps {
  taskId: string
  currentUserId: string
}

export default function TaskComments({taskId, currentUserId}: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTaskComments(taskId)
      setComments(data)
    } catch (error) {
      console.error('加载留言失败:', error)
      Taro.showToast({title: '加载留言失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      Taro.showToast({title: '请输入留言内容', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      await addTaskComment(taskId, currentUserId, newComment.trim())
      setNewComment('')
      Taro.showToast({title: '留言成功', icon: 'success'})
      await loadComments()
    } catch (error) {
      console.error('添加留言失败:', error)
      Taro.showToast({title: '留言失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: '确认删除',
        content: '确定要删除这条留言吗？',
        success: (res) => resolve(res.confirm)
      })
    })

    if (!confirmed) return

    try {
      await deleteTaskComment(commentId)
      Taro.showToast({title: '删除成功', icon: 'success'})
      await loadComments()
    } catch (error) {
      console.error('删除留言失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  const formatTime = (time: string) => {
    const date = new Date(time)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }

  return (
    <div className="space-y-4">
      {/* 留言列表 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="i-mdi-comment-text-outline text-2xl text-primary" />
          <span className="text-xl text-foreground font-bold">
            留言 ({comments.length})
          </span>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-6">加载中...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-6 border-2 border-dashed border-input rounded-lg">
            暂无留言
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const profile = comment.profiles as Partial<Profile>
              const isOwner = comment.user_id === currentUserId

              return (
                <div
                  key={comment.id}
                  className="p-4 border-2 border-input rounded-lg bg-card">
                  {/* 用户信息 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url as string}
                            alt="头像"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="i-mdi-account text-2xl text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="text-lg text-foreground font-bold">
                          {profile?.nickname || profile?.username || '未知用户'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(comment.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* 删除按钮 */}
                    {isOwner && (
                      <button
                        type="button"
                        className="px-3 py-1 text-destructive text-base flex items-center justify-center leading-none"
                        onClick={() => handleDelete(comment.id)}>
                        删除
                      </button>
                    )}
                  </div>

                  {/* 留言内容 */}
                  <div className="text-lg text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 添加留言 */}
      <div className="space-y-3">
        <div className="border-2 border-input rounded-lg px-4 py-3 bg-background overflow-hidden">
          <textarea
            className="w-full text-xl text-foreground bg-transparent outline-none resize-none"
            placeholder="添加留言..."
            rows={3}
            value={newComment}
            onInput={(e) => {
              const ev = e as any
              setNewComment(ev.detail?.value ?? ev.target?.value ?? '')
            }}
          />
        </div>

        <button
          type="button"
          className="w-full py-3 bg-gradient-primary rounded-lg text-xl font-bold text-primary-foreground flex items-center justify-center leading-none"
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}>
          {submitting ? '发送中...' : '发送留言'}
        </button>
      </div>
    </div>
  )
}
