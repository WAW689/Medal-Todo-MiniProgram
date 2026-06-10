import {useState, useEffect, useCallback} from 'react'
import {getMedalById} from '@/db/api'
import type {Medal} from '@/db/types'
import Taro, {getCurrentInstance} from '@tarojs/taro'
import RouteGuard from '@/components/RouteGuard'

function MedalDetailPage() {
  const instance = getCurrentInstance()
  const medalId = instance.router?.params?.id

  const [medal, setMedal] = useState<Medal | null>(null)

  const loadMedal = useCallback(async () => {
    if (!medalId) return

    const medalData = await getMedalById(medalId)
    setMedal(medalData)
  }, [medalId])

  useEffect(() => {
    if (medalId) {
      loadMedal()
    }
  }, [medalId, loadMedal])

  if (!medal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">加载中...</div>
      </div>
    )
  }

  const rarityConfig = {
    common: {
      text: '普通',
      color: 'medal-common',
      bg: 'bg-medal-common',
      icon: 'i-mdi-medal',
      animation: ''
    },
    rare: {
      text: '稀有',
      color: 'medal-rare',
      bg: 'bg-medal-rare',
      icon: 'i-mdi-medal',
      animation: ''
    },
    epic: {
      text: '史诗',
      color: 'medal-epic',
      bg: 'bg-medal-epic',
      icon: 'i-mdi-medal',
      animation: 'animate-shimmer'
    },
    legendary: {
      text: '传说',
      color: 'medal-legendary',
      bg: 'bg-medal-legendary',
      icon: 'i-mdi-medal',
      animation: 'animate-glow animate-float'
    }
  }

  const config = rarityConfig[medal.rarity]

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      {/* 勋章图标 */}
      <div className="flex justify-center mb-8">
        <div
          className={`w-48 h-48 rounded-full ${config.bg} flex items-center justify-center ${config.animation} shadow-medal`}>
          <div className={`${config.icon} text-9xl ${config.color}`} />
        </div>
      </div>

      {/* 勋章名称 */}
      <div className="text-4xl font-bold text-center text-foreground mb-4">{medal.name}</div>

      {/* 稀有度 */}
      <div className="text-center mb-8">
        <span className={`text-3xl font-bold ${config.color}`}>{config.text}</span>
      </div>

      {/* 关联任务 */}
      {medal.tasks && (
        <div className="bg-card rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="i-mdi-clipboard-text-outline text-3xl text-primary" />
            <div className="text-2xl font-bold text-foreground">关联任务</div>
          </div>
          <div className="text-xl text-foreground font-bold mb-2">{medal.tasks.title}</div>
          {medal.tasks.description && (
            <div className="text-lg text-muted-foreground">{medal.tasks.description}</div>
          )}
        </div>
      )}

      {/* 获得时间 */}
      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="i-mdi-clock-outline text-3xl text-primary" />
          <div className="text-2xl font-bold text-foreground">获得时间</div>
        </div>
        <div className="text-xl text-muted-foreground">
          {new Date(medal.obtained_at).toLocaleString('zh-CN')}
        </div>
      </div>

      {/* 获得条件 */}
      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="i-mdi-information-outline text-3xl text-primary" />
          <div className="text-2xl font-bold text-foreground">获得条件</div>
        </div>
        <div className="text-xl text-muted-foreground leading-relaxed">{medal.description}</div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-4">
        {/* 分享按钮 */}
        <button
          type="button"
          className="w-full py-4 bg-gradient-primary rounded-lg text-2xl font-bold text-primary-foreground flex items-center justify-center gap-3 leading-none shadow-elegant"
          onClick={() => Taro.navigateTo({url: `/pages/share-preview/index?id=${medal.id}`})}>
          <div className="i-mdi-share-variant text-3xl" />
          <span>分享成就</span>
        </button>

        {/* 返回按钮 */}
        <button
          type="button"
          className="w-full py-4 border-2 border-input rounded-lg text-2xl font-bold text-muted-foreground flex items-center justify-center leading-none"
          onClick={() => Taro.navigateBack()}>
          返回
        </button>
      </div>
    </div>
  )
}

export default function MedalDetail() {
  return (
    <RouteGuard>
      <MedalDetailPage />
    </RouteGuard>
  )
}
