import {useState, useCallback, useEffect} from 'react'
import Taro from '@tarojs/taro'
import {
  addTaskCollaborator,
  getTaskCollaborators,
  removeTaskCollaborator,
  searchUsers
} from '@/db/api'
import type {TaskCollaborator, Profile, CollaboratorRole} from '@/db/types'

interface CollaboratorManagerProps {
  taskId?: string  // 编辑模式下有taskId,创建模式下为空
  taskOwnerId: string
  currentUserId: string
  onUpdate?: () => void
  // 创建模式下的回调
  onCollaboratorsChange?: (collaborators: Array<{userId: string; role: CollaboratorRole}>) => void
}

export default function CollaboratorManager({
  taskId,
  taskOwnerId,
  currentUserId,
  onUpdate,
  onCollaboratorsChange
}: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([])
  const [selectedCollaborators, setSelectedCollaborators] = useState<Array<{userId: string; username: string; role: CollaboratorRole}>>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<Partial<Profile>[]>([])
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, CollaboratorRole>>({})  // 跟踪每个用户选择的角色

  const isOwner = currentUserId === taskOwnerId
  const isCreateMode = !taskId  // 创建模式

  // 加载协作者列表
  const loadCollaborators = useCallback(async () => {
    if (!taskId) return
    const data = await getTaskCollaborators(taskId)
    setCollaborators(data)
  }, [taskId])

  useEffect(() => {
    if (taskId) {
      loadCollaborators()
    }
  }, [taskId, loadCollaborators])

  // 搜索用户
  const handleSearch = useCallback(async (keyword: string) => {
    setSearchKeyword(keyword)
    if (!keyword.trim()) {
      setSearchResults([])
      return
    }

    const results = await searchUsers(keyword)
    // 过滤掉已经是协作者的用户和任务创建者
    const existingUserIds = new Set([
      taskOwnerId,
      ...collaborators.map(c => c.user_id),
      ...selectedCollaborators.map(c => c.userId)
    ])
    const filtered = results.filter(u => !existingUserIds.has(u.id))
    setSearchResults(filtered)
  }, [taskOwnerId, collaborators, selectedCollaborators])

  // 邀请协作者（编辑模式）
  const handleInvite = async (userId: string, role: CollaboratorRole = 'editor') => {
    if (!isOwner) {
      Taro.showToast({title: '只有任务创建者可以邀请协作者', icon: 'none'})
      return
    }

    if (isCreateMode) {
      // 创建模式：添加到选中列表
      const user = searchResults.find(u => u.id === userId)
      if (user) {
        const newCollaborators = [
          ...selectedCollaborators,
          {userId, username: user.nickname || user.username || '未知用户', role}
        ]
        setSelectedCollaborators(newCollaborators)
        onCollaboratorsChange?.(newCollaborators.map(c => ({userId: c.userId, role: c.role})))
        setSearchKeyword('')
        setSearchResults([])
        Taro.showToast({title: '已添加协作者', icon: 'success'})
      }
      return
    }

    // 编辑模式：直接添加到数据库
    if (!taskId) return

    setLoading(true)
    try {
      await addTaskCollaborator(taskId, userId, role, currentUserId)
      Taro.showToast({title: '邀请成功', icon: 'success'})
      setShowSearch(false)
      setSearchKeyword('')
      setSearchResults([])
      await loadCollaborators()
      onUpdate?.()
    } catch (error) {
      console.error('邀请失败:', error)
      Taro.showToast({title: '邀请失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 移除协作者（编辑模式）
  const handleRemove = async (collaboratorId: string) => {
    if (!isOwner) {
      Taro.showToast({title: '只有任务创建者可以移除协作者', icon: 'none'})
      return
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: '确认移除',
        content: '确定要移除此协作者吗？',
        success: (res) => resolve(res.confirm)
      })
    })

    if (!confirmed) return

    if (!taskId) return

    setLoading(true)
    try {
      await removeTaskCollaborator(collaboratorId)
      Taro.showToast({title: '移除成功', icon: 'success'})
      await loadCollaborators()
      onUpdate?.()
    } catch (error) {
      console.error('移除失败:', error)
      Taro.showToast({title: '移除失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 移除选中的协作者（创建模式）
  const handleRemoveSelected = (userId: string) => {
    const newCollaborators = selectedCollaborators.filter(c => c.userId !== userId)
    setSelectedCollaborators(newCollaborators)
    onCollaboratorsChange?.(newCollaborators.map(c => ({userId: c.userId, role: c.role})))
  }

  const getRoleText = (role: CollaboratorRole) => {
    return role === 'editor' ? '共事' : '监督'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return '已接受'
      case 'pending':
        return '待接受'
      case 'declined':
        return '已拒绝'
      default:
        return '未知'
    }
  }

  if (!isOwner && !isCreateMode) {
    return (
      <div className="text-center text-muted-foreground py-4">
        只有任务创建者可以管理协作者
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 搜索用户 */}
      {isOwner && (
        <div>
          <button
            type="button"
            className="w-full py-3 border-2 border-primary text-primary rounded-lg text-lg font-bold flex items-center justify-center leading-none mb-3"
            onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? '取消搜索' : '添加协作者'}
          </button>

          {showSearch && (
            <div className="space-y-3">
              {/* 搜索框 */}
              <div className="border-2 border-input rounded-lg px-4 py-3 bg-background overflow-hidden">
                <input
                  type="text"
                  className="w-full text-xl text-foreground bg-transparent outline-none"
                  placeholder="搜索用户名或昵称"
                  value={searchKeyword}
                  onInput={(e) => {
                    const ev = e as any
                    handleSearch(ev.detail?.value ?? ev.target?.value ?? '')
                  }}
                />
              </div>

              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => {
                    const userId = user.id || ''
                    const selectedRole = selectedRoles[userId] || 'editor'
                    
                    return (
                      <div
                        key={user.id}
                        className="p-3 border-2 border-input rounded-lg bg-background space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-lg text-foreground font-bold">
                              {user.nickname || user.username || '未知用户'}
                            </div>
                            <div className="text-base text-muted-foreground">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                        
                        {/* 角色选择 */}
                        <div className="flex items-center gap-3">
                          <span className="text-base text-muted-foreground">角色：</span>
                          <div className="flex gap-2 flex-1">
                            <button
                              type="button"
                              className={`flex-1 py-2 rounded-lg text-base font-bold flex items-center justify-center leading-none transition-all ${
                                selectedRole === 'viewer'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'border-2 border-input text-muted-foreground'
                              }`}
                              onClick={() => setSelectedRoles({...selectedRoles, [userId]: 'viewer'})}>
                              监督
                            </button>
                            <button
                              type="button"
                              className={`flex-1 py-2 rounded-lg text-base font-bold flex items-center justify-center leading-none transition-all ${
                                selectedRole === 'editor'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'border-2 border-input text-muted-foreground'
                              }`}
                              onClick={() => setSelectedRoles({...selectedRoles, [userId]: 'editor'})}>
                              共事
                            </button>
                          </div>
                        </div>
                        
                        {/* 邀请按钮 */}
                        <button
                          type="button"
                          className="w-full py-2 bg-gradient-primary text-primary-foreground rounded-lg text-base font-bold flex items-center justify-center leading-none"
                          onClick={() => {
                            handleInvite(userId, selectedRole)
                            // 清除该用户的角色选择
                            const newRoles = {...selectedRoles}
                            delete newRoles[userId]
                            setSelectedRoles(newRoles)
                          }}
                          disabled={loading}>
                          邀请为{selectedRole === 'viewer' ? '监督' : '共事'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {searchKeyword && searchResults.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  未找到用户
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 协作者列表 */}
      {isCreateMode ? (
        // 创建模式：显示选中的协作者
        selectedCollaborators.length > 0 ? (
          <div className="space-y-3">
            {selectedCollaborators.map((collaborator) => (
              <div
                key={collaborator.userId}
                className="flex items-center justify-between p-4 border-2 border-input rounded-lg bg-background">
                <div className="flex-1">
                  <div className="text-lg text-foreground font-bold mb-1">
                    {collaborator.username}
                  </div>
                  <div className="text-base text-muted-foreground">
                    {getRoleText(collaborator.role)}
                  </div>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    className="px-4 py-2 border-2 border-destructive text-destructive rounded-lg text-base font-bold flex items-center justify-center leading-none"
                    onClick={() => handleRemoveSelected(collaborator.userId)}>
                    移除
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6 border-2 border-dashed border-input rounded-lg">
            暂无协作者
          </div>
        )
      ) : (
        // 编辑模式：显示数据库中的协作者
        collaborators.length > 0 ? (
          <div className="space-y-3">
            {collaborators.map((collaborator) => {
              const profile = collaborator.profiles as Partial<Profile>
              return (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-4 border-2 border-input rounded-lg bg-background">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-lg text-foreground font-bold">
                        {profile?.nickname || profile?.username || '未知用户'}
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-sm ${
                          collaborator.status === 'accepted'
                            ? 'bg-primary/20 text-primary'
                            : collaborator.status === 'pending'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-destructive/20 text-destructive'
                        }`}>
                        {getStatusText(collaborator.status)}
                      </div>
                    </div>
                    <div className="text-base text-muted-foreground">
                      {getRoleText(collaborator.role)}
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      className="px-4 py-2 border-2 border-destructive text-destructive rounded-lg text-base font-bold flex items-center justify-center leading-none"
                      onClick={() => handleRemove(collaborator.id)}
                      disabled={loading}>
                      移除
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6 border-2 border-dashed border-input rounded-lg">
            暂无协作者
          </div>
        )
      )}
    </div>
  )
}
