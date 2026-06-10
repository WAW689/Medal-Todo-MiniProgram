import {useState} from 'react'
import type {Tag} from '@/db/types'
import TagBadge from './TagBadge'

interface TagSelectorProps {
  availableTags: Tag[]
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
  onCreateTag?: () => void
}

export default function TagSelector({
  availableTags,
  selectedTagIds,
  onTagsChange,
  onCreateTag
}: TagSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id))
  const unselectedTags = availableTags.filter(tag => !selectedTagIds.includes(tag.id))

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      onTagsChange([...selectedTagIds, tagId])
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId))
  }

  return (
    <div className="space-y-3">
      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              size="md"
              onRemove={() => handleRemoveTag(tag.id)}
            />
          ))}
        </div>
      )}

      {/* 选择按钮 */}
      <div className="relative">
        <button
          type="button"
          className="w-full border-2 border-input rounded-lg px-4 py-3 bg-background flex items-center justify-between text-lg"
          onClick={() => setShowDropdown(!showDropdown)}>
          <span className="text-muted-foreground">
            {selectedTags.length > 0 ? `已选择 ${selectedTags.length} 个标签` : '选择标签'}
          </span>
          <div className={`i-mdi-chevron-down text-2xl transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* 下拉列表 */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 border-2 border-input rounded-lg bg-card shadow-lg z-10 max-h-64 overflow-y-auto">
            {unselectedTags.length > 0 ? (
              <div className="p-2">
                {unselectedTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    className="w-full px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2 text-left"
                    onClick={() => {
                      handleToggleTag(tag.id)
                      setShowDropdown(false)
                    }}>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{backgroundColor: tag.color}}
                    />
                    <span className="text-lg">{tag.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {availableTags.length === 0 ? '暂无标签' : '所有标签已选择'}
              </div>
            )}

            {/* 创建新标签按钮 */}
            {onCreateTag && (
              <div className="border-t-2 border-input p-2">
                <button
                  type="button"
                  className="w-full px-3 py-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center gap-2 text-lg font-medium"
                  onClick={() => {
                    setShowDropdown(false)
                    onCreateTag()
                  }}>
                  <div className="i-mdi-plus text-2xl" />
                  <span>创建新标签</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
