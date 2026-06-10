import type {Medal} from '@/db/types'
import Taro from '@tarojs/taro'

interface MedalCardProps {
  medal: Medal
  onClick?: () => void
  showShareButton?: boolean
}

export default function MedalCard({medal, onClick, showShareButton = false}: MedalCardProps) {
  const rarityConfig = {
    common: {
      color: 'medal-common',
      bg: 'bg-medal-common',
      icon: 'i-mdi-medal',
      animation: ''
    },
    rare: {
      color: 'medal-rare',
      bg: 'bg-medal-rare',
      icon: 'i-mdi-medal',
      animation: ''
    },
    epic: {
      color: 'medal-epic',
      bg: 'bg-medal-epic',
      icon: 'i-mdi-medal',
      animation: 'animate-shimmer'
    },
    legendary: {
      color: 'medal-legendary',
      bg: 'bg-medal-legendary',
      icon: 'i-mdi-medal',
      animation: 'animate-glow'
    }
  }

  const config = rarityConfig[medal.rarity]

  const handleShare = (e: {stopPropagation: () => void}) => {
    e.stopPropagation()
    Taro.navigateTo({url: `/pages/share-preview/index?id=${medal.id}`})
  }

  return (
    <div className="flex-shrink-0 relative">
      <div
        className={`w-32 h-40 rounded-lg ${config.bg} flex flex-col items-center justify-center transition-all ${config.animation} p-2`}
        onClick={onClick}>
        <div className={`${config.icon} text-6xl ${config.color} mb-2`} />
        {medal.tasks && (
          <div className="text-xs text-center text-foreground font-bold line-clamp-2 break-words">
            {medal.tasks.title}
          </div>
        )}
      </div>
      
      {showShareButton && (
        <div
          className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-elegant"
          onClick={handleShare}>
          <div className="i-mdi-share-variant text-xl text-primary-foreground" />
        </div>
      )}
    </div>
  )
}
