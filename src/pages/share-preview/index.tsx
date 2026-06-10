import {useState, useEffect, useCallback} from 'react'
import {getMedalById} from '@/db/api'
import {useAuth} from '@/contexts/AuthContext'
import type {MedalWithTask} from '@/db/types'
import Taro, {getCurrentInstance, useShareAppMessage, useShareTimeline} from '@tarojs/taro'
import {Canvas} from '@tarojs/components'
import {SHARE_TEMPLATES, generateShareImage, saveImageToAlbum} from '@/utils/shareImage'
import RouteGuard from '@/components/RouteGuard'

function SharePreviewPage() {
  const instance = getCurrentInstance()
  const medalId = instance.router?.params?.id
  const {profile} = useAuth()

  const [medal, setMedal] = useState<MedalWithTask | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('simple')
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const [loading, setLoading] = useState(false)

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

  const handleGenerateImage = async () => {
    if (!medal || !profile) return

    // 检查是否有关联的任务信息
    if (!medal.tasks) {
      Taro.showToast({
        title: '缺少任务信息',
        icon: 'none'
      })
      return
    }

    setLoading(true)

    try {
      const username = (profile.nickname as string) || (profile.username as string) || '用户'
      
      // 提取已接受的协作者信息
      const collaborators = medal.tasks.task_collaborators?.filter((c: any) => c.status === 'accepted') || []
      
      const imagePath = await generateShareImage(
        medal, 
        medal.tasks, 
        username, 
        selectedTemplate,
        collaborators
      )
      setGeneratedImage(imagePath)
      Taro.showToast({title: '生成成功', icon: 'success'})
    } catch (error) {
      console.error('生成分享图失败:', error)
      Taro.showToast({title: '生成失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToAlbum = async () => {
    if (!generatedImage) {
      Taro.showToast({title: '请先生成图片', icon: 'none'})
      return
    }

    await saveImageToAlbum(generatedImage)
  }

  const handleShare = () => {
    if (!generatedImage) {
      Taro.showToast({title: '请先生成图片', icon: 'none'})
      return
    }

    Taro.showToast({
      title: '点击右上角分享',
      icon: 'none'
    })
  }

  // 配置分享到聊天
  useShareAppMessage(() => {
    const taskTitle = medal?.tasks?.title || '任务'
    return {
      title: `我完成了「${taskTitle}」，获得了${medal?.name}勋章！`,
      imageUrl: generatedImage || undefined
    }
  })

  // 配置分享到朋友圈
  useShareTimeline(() => {
    const taskTitle = medal?.tasks?.title || '任务'
    return {
      title: `我完成了「${taskTitle}」，获得了${medal?.name}勋章！`,
      imageUrl: generatedImage || undefined
    }
  })

  if (!medal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* 隐藏的Canvas用于生成图片 */}
      <Canvas
        type="2d"
        id="shareCanvas"
        canvasId="shareCanvas"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '750px',
          height: '1000px'
        }}
      />

      {/* 模板选择 */}
      <div className="px-6 py-8">
        <div className="text-3xl font-bold text-foreground mb-6">选择分享模板</div>

        <div className="space-y-4 mb-8">
          {SHARE_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`bg-card rounded-lg p-6 border-2 transition-all ${
                selectedTemplate === template.id ? 'border-primary' : 'border-input'
              }`}
              onClick={() => setSelectedTemplate(template.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground mb-2">{template.name}</div>
                  <div className="text-lg text-muted-foreground">{template.description}</div>
                </div>
                {selectedTemplate === template.id && (
                  <div className="i-mdi-check-circle text-4xl text-primary" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 生成按钮 */}
        <button
          type="button"
          className={`w-full py-4 rounded-lg text-2xl font-bold mb-4 flex items-center justify-center leading-none ${
            loading ? 'bg-primary/50' : 'bg-gradient-primary shadow-elegant'
          }`}
          onClick={handleGenerateImage}
          disabled={loading}>
          {loading ? '生成中...' : '生成分享图'}
        </button>

        {/* 预览区域 */}
        {generatedImage && (
          <div className="mb-8">
            <div className="text-2xl font-bold text-foreground mb-4">预览</div>
            <div className="bg-card rounded-lg p-4">
              <img src={generatedImage} alt="分享预览" className="w-full rounded-lg" />
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {generatedImage && (
          <div className="space-y-4">
            <button
              type="button"
              className="w-full py-4 bg-gradient-primary rounded-lg text-2xl font-bold flex items-center justify-center gap-3 leading-none shadow-elegant"
              onClick={handleSaveToAlbum}>
              <div className="i-mdi-download text-3xl" />
              <span>保存到相册</span>
            </button>

            <button
              type="button"
              className="w-full py-4 border-2 border-primary rounded-lg text-2xl font-bold text-primary flex items-center justify-center gap-3 leading-none"
              onClick={handleShare}>
              <div className="i-mdi-share-variant text-3xl" />
              <span>分享给好友</span>
            </button>
          </div>
        )}

        {/* 返回按钮 */}
        <button
          type="button"
          className="w-full mt-4 py-4 border-2 border-input rounded-lg text-2xl font-bold text-muted-foreground flex items-center justify-center leading-none"
          onClick={() => Taro.navigateBack()}>
          返回
        </button>
      </div>
    </div>
  )
}

export default function SharePreview() {
  return (
    <RouteGuard>
      <SharePreviewPage />
    </RouteGuard>
  )
}
