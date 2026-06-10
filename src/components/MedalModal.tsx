import type {Medal} from '@/db/types'

interface MedalModalProps {
  medal: Medal | null
  visible: boolean
  onClose: () => void
}

export default function MedalModal({medal, visible, onClose}: MedalModalProps) {
  if (!visible || !medal) return null

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"
      onClick={onClose}>
      <div
        className="bg-card rounded-lg p-8 mx-6 max-w-md w-full shadow-medal"
        onClick={(e) => e.stopPropagation()}>
        {/* 勋章图标 */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-32 h-32 rounded-full ${config.bg} flex items-center justify-center ${config.animation}`}>
            <div className={`${config.icon} text-8xl ${config.color}`} />
          </div>
        </div>

        {/* 勋章名称 */}
        <div className="text-3xl font-bold text-center text-foreground mb-3">{medal.name}</div>

        {/* 稀有度 */}
        <div className="text-center mb-6">
          <span className={`text-2xl font-bold ${config.color}`}>{config.text}</span>
        </div>

        {/* 获得条件 */}
        <div className="bg-background rounded-lg p-4 mb-6">
          <div className="text-lg text-muted-foreground text-center">{medal.description}</div>
        </div>

        {/* 关闭按钮 */}
        <button
          type="button"
          className="w-full py-4 bg-gradient-primary rounded-lg text-2xl font-bold text-primary-foreground flex items-center justify-center leading-none"
          onClick={onClose}>
          确定
        </button>
      </div>
    </div>
  )
}
