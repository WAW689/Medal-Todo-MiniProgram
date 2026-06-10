import Taro from '@tarojs/taro'
import type {Medal, Task, CollaboratorRole, CollaboratorStatus, Profile} from '@/db/types'

export interface ShareTemplate {
  id: string
  name: string
  description: string
}

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {id: 'simple', name: '简约风格', description: '黑色背景，任务信息居中'},
  {id: 'card', name: '卡片风格', description: '带边框，突出任务成就'},
  {id: 'certificate', name: '证书风格', description: '正式感，适合重要任务'}
]

export interface CollaboratorInfo {
  role: CollaboratorRole
  status: CollaboratorStatus
  profiles?: Partial<Profile>
}

/**
 * 绘制简约风格分享图
 */
async function drawSimpleTemplate(
  ctx: CanvasRenderingContext2D,
  medal: Medal,
  task: Task,
  username: string,
  canvasWidth: number,
  canvasHeight: number,
  collaborators?: CollaboratorInfo[]
) {
  // 背景
  ctx.fillStyle = '#141414'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 勋章稀有度颜色映射
  const rarityColors = {
    common: '#808080',
    rare: '#3B82F6',
    epic: '#A855F7',
    legendary: '#F59E0B'
  }

  const rarityNames = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }

  const difficultyNames = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }

  const roleNames = {
    viewer: '监督',
    editor: '共事'
  }

  const color = rarityColors[medal.rarity]

  // 顶部装饰线
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvasWidth, 8)

  // 标题区域
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('我完成了一项任务', canvasWidth / 2, 80)

  // 任务标题（最突出）
  ctx.fillStyle = color
  ctx.font = 'bold 52px sans-serif'
  const maxTitleWidth = canvasWidth - 80
  const titleText = task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title
  ctx.fillText(titleText, canvasWidth / 2, 160)

  // 任务难度标签
  const tagY = 230
  const tagWidth = 100
  const tagHeight = 40
  ctx.fillStyle = color
  ctx.fillRect(canvasWidth / 2 - tagWidth / 2, tagY, tagWidth, tagHeight)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 24px sans-serif'
  ctx.fillText(difficultyNames[task.difficulty], canvasWidth / 2, tagY + tagHeight / 2)

  // 任务描述（如果有）
  let currentY = 310
  if (task.description) {
    ctx.fillStyle = '#CCCCCC'
    ctx.font = '24px sans-serif'
    const descText = task.description.length > 30 ? task.description.substring(0, 30) + '...' : task.description
    ctx.fillText(descText, canvasWidth / 2, currentY)
    currentY += 60
  } else {
    currentY += 30
  }

  // 团队成员信息（任务创建者+协作者）
  const acceptedCollaborators = collaborators?.filter(c => c.status === 'accepted') || []
  if (acceptedCollaborators.length > 0) {
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 26px sans-serif'
    ctx.fillText('团队成员', canvasWidth / 2, currentY)
    currentY += 40

    // 显示任务创建者
    ctx.font = '22px sans-serif'
    ctx.fillStyle = '#CCCCCC'
    ctx.fillText(`${username} (创建者)`, canvasWidth / 2, currentY)
    currentY += 32

    // 显示协作者
    acceptedCollaborators.forEach((collab) => {
      const name = collab.profiles?.nickname || collab.profiles?.username || '未知用户'
      const role = roleNames[collab.role as keyof typeof roleNames] || collab.role
      ctx.fillText(`${name} (${role})`, canvasWidth / 2, currentY)
      currentY += 32
    })
    currentY += 20
  }

  // 勋章图标区域（缩小，不再是主角）
  const iconSize = 140
  const iconX = canvasWidth / 2
  const iconY = currentY + 50

  // 绘制发光效果
  if (medal.rarity === 'epic' || medal.rarity === 'legendary') {
    ctx.fillStyle = `${color}40`
    ctx.beginPath()
    ctx.arc(iconX, iconY, iconSize / 2 + 20, 0, 2 * Math.PI)
    ctx.fill()
  }

  // 勋章背景圆
  ctx.fillStyle = `${color}33`
  ctx.beginPath()
  ctx.arc(iconX, iconY, iconSize / 2, 0, 2 * Math.PI)
  ctx.fill()

  // 勋章图标
  ctx.fillStyle = color
  ctx.font = '80px sans-serif'
  ctx.fillText('🏅', iconX, iconY)

  // 勋章名称和稀有度
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText(medal.name, canvasWidth / 2, iconY + 100)

  ctx.fillStyle = color
  ctx.font = '24px sans-serif'
  ctx.fillText(rarityNames[medal.rarity], canvasWidth / 2, iconY + 140)

  // 完成信息
  const infoY = iconY + 200
  ctx.fillStyle = '#999999'
  ctx.font = '22px sans-serif'
  
  // 完成日期
  const completedDate = new Date(task.completed_at || task.updated_at).toLocaleDateString('zh-CN')
  ctx.fillText(`完成于 ${completedDate}`, canvasWidth / 2, infoY)

  // 预估耗时（如果有）
  if (task.estimated_hours) {
    ctx.fillText(`耗时 ${task.estimated_hours} 小时`, canvasWidth / 2, infoY + 35)
  }

  // 用户名
  if (username) {
    ctx.fillStyle = '#CCCCCC'
    ctx.font = '26px sans-serif'
    ctx.fillText(`@${username}`, canvasWidth / 2, infoY + (task.estimated_hours ? 75 : 40))
  }

  // 底部品牌标识
  ctx.fillStyle = '#666666'
  ctx.font = '24px sans-serif'
  ctx.fillText('勋章待办', canvasWidth / 2, canvasHeight - 60)

  ctx.fillStyle = '#444444'
  ctx.font = '20px sans-serif'
  ctx.fillText('将每次完成转化为可视化成就', canvasWidth / 2, canvasHeight - 30)
}

/**
 * 绘制卡片风格分享图
 */
async function drawCardTemplate(
  ctx: CanvasRenderingContext2D,
  medal: Medal,
  task: Task,
  username: string,
  canvasWidth: number,
  canvasHeight: number,
  collaborators?: CollaboratorInfo[]
) {
  // 背景渐变（模拟）
  ctx.fillStyle = '#0A0A0A'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const rarityColors = {
    common: '#808080',
    rare: '#3B82F6',
    epic: '#A855F7',
    legendary: '#F59E0B'
  }

  const rarityNames = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }

  const difficultyNames = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }

  const color = rarityColors[medal.rarity]

  // 卡片背景
  const cardPadding = 40
  const cardX = cardPadding
  const cardY = 100
  const cardWidth = canvasWidth - cardPadding * 2
  const cardHeight = canvasHeight - 200

  // 卡片阴影
  ctx.fillStyle = '#00000080'
  ctx.fillRect(cardX + 10, cardY + 10, cardWidth, cardHeight)

  // 卡片主体
  ctx.fillStyle = '#1F1F1F'
  ctx.fillRect(cardX, cardY, cardWidth, cardHeight)

  // 卡片边框
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.strokeRect(cardX, cardY, cardWidth, cardHeight)

  // 顶部装饰条
  ctx.fillStyle = color
  ctx.fillRect(cardX, cardY, cardWidth, 12)

  // 任务完成标题
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✓ 任务完成', canvasWidth / 2, cardY + 50)

  // 任务标题
  ctx.fillStyle = color
  ctx.font = 'bold 44px sans-serif'
  const titleText = task.title.length > 12 ? task.title.substring(0, 12) + '...' : task.title
  ctx.fillText(titleText, canvasWidth / 2, cardY + 110)

  // 任务信息区域
  const infoY = cardY + 170
  ctx.fillStyle = '#AAAAAA'
  ctx.font = '24px sans-serif'
  
  // 难度
  ctx.fillText(`难度：${difficultyNames[task.difficulty]}`, canvasWidth / 2, infoY)
  
  // 耗时
  if (task.estimated_hours) {
    ctx.fillText(`耗时：${task.estimated_hours} 小时`, canvasWidth / 2, infoY + 35)
  }

  // 完成日期
  const completedDate = new Date(task.completed_at || task.updated_at).toLocaleDateString('zh-CN')
  ctx.fillText(`完成：${completedDate}`, canvasWidth / 2, infoY + (task.estimated_hours ? 70 : 35))

  // 勋章图标（缩小）
  const iconSize = 120
  const iconX = canvasWidth / 2
  const iconY = cardY + (task.estimated_hours ? 320 : 285)

  // 勋章背景
  ctx.fillStyle = `${color}33`
  ctx.beginPath()
  ctx.arc(iconX, iconY, iconSize / 2, 0, 2 * Math.PI)
  ctx.fill()

  // 勋章边框
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(iconX, iconY, iconSize / 2, 0, 2 * Math.PI)
  ctx.stroke()

  // 勋章图标
  ctx.fillStyle = color
  ctx.font = '70px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🏅', iconX, iconY)

  // 勋章名称
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText(medal.name, canvasWidth / 2, iconY + 90)

  // 稀有度标签背景
  const tagWidth = 120
  const tagHeight = 36
  const tagX = canvasWidth / 2 - tagWidth / 2
  const tagY = iconY + 125

  ctx.fillStyle = color
  ctx.fillRect(tagX, tagY, tagWidth, tagHeight)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '24px sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(rarityNames[medal.rarity], canvasWidth / 2, tagY + tagHeight / 2)

  // 用户名
  if (username) {
    ctx.fillStyle = '#CCCCCC'
    ctx.font = '26px sans-serif'
    ctx.fillText(`@${username}`, canvasWidth / 2, iconY + 180)
  }

  // 底部品牌
  ctx.fillStyle = '#E02424'
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText('勋章待办', canvasWidth / 2, canvasHeight - 80)

  ctx.fillStyle = '#666666'
  ctx.font = '20px sans-serif'
  ctx.fillText('将每次完成转化为可视化成就', canvasWidth / 2, canvasHeight - 45)
}

/**
 * 绘制证书风格分享图
 */
async function drawCertificateTemplate(
  ctx: CanvasRenderingContext2D,
  medal: Medal,
  task: Task,
  username: string,
  canvasWidth: number,
  canvasHeight: number,
  collaborators?: CollaboratorInfo[]
) {
  // 背景
  ctx.fillStyle = '#1A1A1A'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const rarityColors = {
    common: '#808080',
    rare: '#3B82F6',
    epic: '#A855F7',
    legendary: '#F59E0B'
  }

  const rarityNames = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }

  const difficultyNames = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }

  const color = rarityColors[medal.rarity]

  // 证书边框
  const borderPadding = 30
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  ctx.strokeRect(borderPadding, borderPadding, canvasWidth - borderPadding * 2, canvasHeight - borderPadding * 2)

  // 内边框
  ctx.lineWidth = 2
  ctx.strokeRect(borderPadding + 15, borderPadding + 15, canvasWidth - (borderPadding + 15) * 2, canvasHeight - (borderPadding + 15) * 2)

  // 顶部标题
  ctx.fillStyle = color
  ctx.font = 'bold 40px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('任务完成证书', canvasWidth / 2, 100)

  // 分隔线
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(canvasWidth / 2 - 120, 130)
  ctx.lineTo(canvasWidth / 2 + 120, 130)
  ctx.stroke()

  // 证书内容
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '28px sans-serif'
  ctx.fillText('兹证明', canvasWidth / 2, 190)

  // 用户名
  if (username) {
    ctx.fillStyle = color
    ctx.font = 'bold 40px sans-serif'
    ctx.fillText(username, canvasWidth / 2, 250)
  }

  // 成就描述
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '26px sans-serif'
  ctx.fillText('成功完成任务', canvasWidth / 2, 310)

  // 任务标题
  ctx.fillStyle = color
  ctx.font = 'bold 48px sans-serif'
  const titleText = task.title.length > 12 ? task.title.substring(0, 12) + '...' : task.title
  ctx.fillText(`「${titleText}」`, canvasWidth / 2, 380)

  // 任务详情
  ctx.fillStyle = '#AAAAAA'
  ctx.font = '24px sans-serif'
  ctx.fillText(`难度：${difficultyNames[task.difficulty]}`, canvasWidth / 2, 450)

  if (task.estimated_hours) {
    ctx.fillText(`耗时：${task.estimated_hours} 小时`, canvasWidth / 2, 485)
  }

  // 勋章图标（缩小）
  const iconSize = 100
  const iconX = canvasWidth / 2
  const iconY = task.estimated_hours ? 570 : 540

  ctx.fillStyle = `${color}33`
  ctx.beginPath()
  ctx.arc(iconX, iconY, iconSize / 2, 0, 2 * Math.PI)
  ctx.fill()

  ctx.fillStyle = color
  ctx.font = '60px sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('🏅', iconX, iconY)

  // 勋章信息
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText(medal.name, canvasWidth / 2, iconY + 80)

  ctx.fillStyle = color
  ctx.font = '24px sans-serif'
  ctx.fillText(`稀有度：${rarityNames[medal.rarity]}`, canvasWidth / 2, iconY + 120)

  // 完成日期
  const completedDate = new Date(task.completed_at || task.updated_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  ctx.fillStyle = '#CCCCCC'
  ctx.font = '22px sans-serif'
  ctx.fillText(completedDate, canvasWidth / 2, iconY + 170)

  // 底部签章
  ctx.fillStyle = color
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText('勋章待办', canvasWidth / 2, canvasHeight - 80)

  ctx.fillStyle = '#666666'
  ctx.font = '20px sans-serif'
  ctx.fillText('官方认证', canvasWidth / 2, canvasHeight - 50)
}

/**
 * 生成分享图片
 */
export async function generateShareImage(
  medal: Medal,
  task: Task,
  username: string,
  templateId: string = 'simple',
  collaborators?: CollaboratorInfo[]
): Promise<string> {
  const canvasWidth = 750
  const canvasHeight = 1000

  return new Promise((resolve, reject) => {
    const query = Taro.createSelectorQuery()
    query
      .select('#shareCanvas')
      .fields({node: true, size: true})
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas节点未找到'))
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

        if (!ctx) {
          reject(new Error('无法获取Canvas上下文'))
          return
        }

        const dpr = Taro.getSystemInfoSync().pixelRatio
        canvas.width = canvasWidth * dpr
        canvas.height = canvasHeight * dpr
        ctx.scale(dpr, dpr)

        // 根据模板绘制
        let drawPromise: Promise<void>

        switch (templateId) {
          case 'card':
            drawPromise = drawCardTemplate(ctx, medal, task, username, canvasWidth, canvasHeight, collaborators)
            break
          case 'certificate':
            drawPromise = drawCertificateTemplate(ctx, medal, task, username, canvasWidth, canvasHeight, collaborators)
            break
          default:
            drawPromise = drawSimpleTemplate(ctx, medal, task, username, canvasWidth, canvasHeight, collaborators)
        }

        drawPromise
          .then(() => {
            // Canvas 2D 不需要调用 draw()，直接导出
            setTimeout(() => {
              Taro.canvasToTempFilePath({
                canvas,
                x: 0,
                y: 0,
                width: canvasWidth,
                height: canvasHeight,
                destWidth: canvasWidth * dpr,
                destHeight: canvasHeight * dpr,
                success: (result) => {
                  resolve(result.tempFilePath)
                },
                fail: (error) => {
                  console.error('导出图片失败:', error)
                  reject(error)
                }
              })
            }, 300)
          })
          .catch((error) => {
            console.error('绘制失败:', error)
            reject(error)
          })
      })
  })
}

/**
 * 保存图片到相册
 */
export async function saveImageToAlbum(filePath: string): Promise<boolean> {
  try {
    // 请求保存到相册权限
    await Taro.authorize({scope: 'scope.writePhotosAlbum'})

    await Taro.saveImageToPhotosAlbum({
      filePath
    })

    Taro.showToast({
      title: '已保存到相册',
      icon: 'success'
    })

    return true
  } catch (error: unknown) {
    const err = error as {errMsg?: string}
    if (err.errMsg?.includes('auth deny')) {
      // 权限被拒绝，引导用户打开设置
      const result = await Taro.showModal({
        title: '需要相册权限',
        content: '请在设置中允许访问相册',
        confirmText: '去设置'
      })

      if (result.confirm) {
        await Taro.openSetting()
      }
    } else {
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }

    return false
  }
}
