import {useState, useCallback} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {getUserTags, createTag, updateTag, deleteTag} from '@/db/api'
import type {Tag} from '@/db/types'
import Taro, {useDidShow} from '@tarojs/taro'
import TagBadge from '@/components/TagBadge'
import ColorPicker from '@/components/ColorPicker'
import RouteGuard from '@/components/RouteGuard'

function TagManagerPage() {
  const {user} = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#3B82F6')

  const loadTags = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await getUserTags(user.id)
      setTags(data)
    } catch (error) {
      console.error('加载标签失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadTags()
  })

  const handleCreate = async () => {
    if (!user || !tagName.trim()) {
      Taro.showToast({title: '请输入标签名称', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      await createTag(user.id, tagName.trim(), tagColor)
      Taro.showToast({title: '创建成功', icon: 'success'})
      setShowCreateModal(false)
      setTagName('')
      setTagColor('#3B82F6')
      await loadTags()
    } catch (error: any) {
      console.error('创建标签失败:', error)
      Taro.showToast({title: error.message || '创建失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingTag || !tagName.trim()) {
      Taro.showToast({title: '请输入标签名称', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      await updateTag(editingTag.id, tagName.trim(), tagColor)
      Taro.showToast({title: '更新成功', icon: 'success'})
      setShowEditModal(false)
      setEditingTag(null)
      setTagName('')
      setTagColor('#3B82F6')
      await loadTags()
    } catch (error: any) {
      console.error('更新标签失败:', error)
      Taro.showToast({title: error.message || '更新失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tag: Tag) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除标签"${tag.name}"吗？这将解除所有任务与该标签的关联。`,
      confirmText: '删除',
      cancelText: '取消'
    })

    if (!result.confirm) return

    setLoading(true)
    try {
      await deleteTag(tag.id)
      Taro.showToast({title: '删除成功', icon: 'success'})
      await loadTags()
    } catch (error: any) {
      console.error('删除标签失败:', error)
      Taro.showToast({title: error.message || '删除失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag)
    setTagName(tag.name)
    setTagColor(tag.color)
    setShowEditModal(true)
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
    <RouteGuard>
      <div className="min-h-screen bg-background pb-24">
        {/* 头部 */}
        <div className="bg-gradient-card px-6 py-8">
          <div className="text-4xl font-bold text-foreground mb-2">标签管理</div>
          <div className="text-xl text-muted-foreground">
            {tags.length > 0 ? `共 ${tags.length} 个标签` : '暂无标签'}
          </div>
        </div>

        {/* 标签列表 */}
        <div className="px-6 py-6">
          {loading && tags.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">加载中...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <div className="i-mdi-tag-outline text-8xl text-muted-foreground mb-4" />
              <div className="text-2xl text-muted-foreground mb-2">暂无标签</div>
              <div className="text-lg text-muted-foreground mb-6">
                创建标签来更好地组织你的任务
              </div>
              <button
                type="button"
                className="px-8 py-4 bg-gradient-primary rounded-lg text-2xl font-bold text-primary-foreground flex items-center justify-center leading-none mx-auto"
                onClick={() => setShowCreateModal(true)}>
                <div className="i-mdi-plus text-3xl mr-2" />
                创建标签
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="border-2 border-input rounded-lg p-4 bg-card flex items-center justify-between">
                  <TagBadge tag={tag} size="lg" />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-muted"
                      onClick={() => openEditModal(tag)}>
                      <div className="i-mdi-pencil text-2xl text-primary" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-muted"
                      onClick={() => handleDelete(tag)}>
                      <div className="i-mdi-delete text-2xl text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 创建按钮（固定在底部） */}
        {tags.length > 0 && (
          <div className="fixed bottom-24 right-6">
            <button
              type="button"
              className="w-16 h-16 bg-gradient-primary rounded-full shadow-lg flex items-center justify-center"
              onClick={() => setShowCreateModal(true)}>
              <div className="i-mdi-plus text-4xl text-primary-foreground" />
            </button>
          </div>
        )}

        {/* 创建标签弹窗 */}
        {showCreateModal && (
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
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* 颜色选择 */}
                <div>
                  <div className="text-lg text-foreground mb-3">选择颜色</div>
                  <ColorPicker
                    selectedColor={tagColor}
                    onColorSelect={setTagColor}
                  />
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  className="flex-1 py-3 border-2 border-input rounded-lg text-xl font-bold text-foreground flex items-center justify-center leading-none"
                  onClick={() => {
                    setShowCreateModal(false)
                    setTagName('')
                    setTagColor('#3B82F6')
                  }}
                  disabled={loading}>
                  取消
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 bg-gradient-primary rounded-lg text-xl font-bold text-primary-foreground flex items-center justify-center leading-none"
                  onClick={handleCreate}
                  disabled={loading || !tagName.trim()}>
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑标签弹窗 */}
        {showEditModal && editingTag && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <div className="text-3xl font-bold text-foreground mb-6">编辑标签</div>

              <div className="space-y-6">
                {/* 标签名称 */}
                <div>
                  <div className="text-lg text-foreground mb-2">标签名称</div>
                  <div className="border-2 border-input rounded-lg px-4 py-3 bg-background">
                    <input
                      className="w-full text-xl text-foreground bg-transparent outline-none"
                      placeholder="输入标签名称"
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* 颜色选择 */}
                <div>
                  <div className="text-lg text-foreground mb-3">选择颜色</div>
                  <ColorPicker
                    selectedColor={tagColor}
                    onColorSelect={setTagColor}
                  />
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  className="flex-1 py-3 border-2 border-input rounded-lg text-xl font-bold text-foreground flex items-center justify-center leading-none"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingTag(null)
                    setTagName('')
                    setTagColor('#3B82F6')
                  }}
                  disabled={loading}>
                  取消
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 bg-gradient-primary rounded-lg text-xl font-bold text-primary-foreground flex items-center justify-center leading-none"
                  onClick={handleEdit}
                  disabled={loading || !tagName.trim()}>
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}

export default TagManagerPage
