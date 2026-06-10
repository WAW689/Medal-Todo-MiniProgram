import {useState} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {getPendingInvitations} from '@/db/api'
import Taro, {useDidShow} from '@tarojs/taro'
import RouteGuard from '@/components/RouteGuard'

function ProfilePage() {
  const {user, profile, signOut} = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useDidShow(() => {
    if (user) {
      loadPendingCount()
    }
  })

  const loadPendingCount = async () => {
    if (!user) return
    const invitations = await getPendingInvitations(user.id)
    setPendingCount(invitations.length)
  }

  const handleLogout = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => resolve(res.confirm)
      })
    })

    if (!confirmed) return

    await signOut()
    Taro.showToast({title: '已退出登录', icon: 'success'})
    setTimeout(() => {
      Taro.reLaunch({url: '/pages/login/index'})
    }, 500)
  }

  if (!user || !profile) {
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
      {/* 用户信息卡片 */}
      <div className="bg-gradient-card px-6 py-12">
        <div className="flex flex-col items-center">
          {/* 头像 */}
          <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mb-6 shadow-elegant">
            {profile.avatar_url ? (
              <div className="w-full h-full rounded-full overflow-hidden">
                <img src={profile.avatar_url as string} alt="头像" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="i-mdi-account text-8xl text-primary" />
            )}
          </div>

          {/* 昵称/用户名 */}
          <div className="text-4xl font-bold text-foreground mb-3">
            {(profile.nickname as string) || (profile.username as string) || '用户'}
          </div>

          {/* 角色标签 */}
          {profile.role === 'admin' && (
            <div className="px-4 py-2 bg-primary/20 rounded-full">
              <span className="text-xl text-primary font-bold">管理员</span>
            </div>
          )}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* 完成任务数 */}
          <div className="bg-card rounded-lg p-6 text-center">
            <div className="i-mdi-check-circle text-5xl text-primary mb-3" />
            <div className="text-4xl font-bold text-foreground mb-2">
              {(profile.total_tasks_completed as number) || 0}
            </div>
            <div className="text-xl text-muted-foreground">完成任务</div>
          </div>

          {/* 获得勋章数 */}
          <div className="bg-card rounded-lg p-6 text-center">
            <div className="i-mdi-medal text-5xl text-primary mb-3" />
            <div className="text-4xl font-bold text-foreground mb-2">{(profile.total_medals as number) || 0}</div>
            <div className="text-xl text-muted-foreground">获得勋章</div>
          </div>
        </div>

        {/* 功能按钮 */}
        <div className="space-y-4">
          {/* 协作邀请 */}
          <button
            type="button"
            className="w-full py-4 bg-card rounded-lg text-2xl font-bold text-foreground flex items-center justify-between px-6 leading-none border-2 border-input relative"
            onClick={() => Taro.navigateTo({url: '/pages/invitations/index'})}>
            <div className="flex items-center gap-3">
              <div className="i-mdi-email-outline text-3xl text-primary" />
              <span>协作邀请</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <div className="px-3 py-1 bg-destructive rounded-full">
                  <span className="text-lg text-white font-bold">{pendingCount}</span>
                </div>
              )}
              <div className="i-mdi-chevron-right text-3xl text-muted-foreground" />
            </div>
          </button>

          {/* 退出登录 */}
          <button
            type="button"
            className="w-full py-4 bg-card rounded-lg text-2xl font-bold text-foreground flex items-center justify-between px-6 leading-none border-2 border-input"
            onClick={handleLogout}>
            <div className="flex items-center gap-3">
              <div className="i-mdi-logout text-3xl text-destructive" />
              <span className="text-destructive">退出登录</span>
            </div>
            <div className="i-mdi-chevron-right text-3xl text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 版权信息 */}
      <div className="text-center text-lg text-muted-foreground px-6 pb-8">
        <div>© 2026 勋章待办</div>
        <div className="mt-2">将每次完成转化为可视化成就</div>
      </div>
    </div>
  )
}

export default function Profile() {
  return (
    <RouteGuard>
      <ProfilePage />
    </RouteGuard>
  )
}
