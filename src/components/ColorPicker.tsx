interface ColorPickerProps {
  selectedColor: string
  onColorSelect: (color: string) => void
}

// 预设颜色
const PRESET_COLORS = [
  {name: '红色', value: '#EF4444'},
  {name: '橙色', value: '#F97316'},
  {name: '黄色', value: '#EAB308'},
  {name: '绿色', value: '#22C55E'},
  {name: '青色', value: '#06B6D4'},
  {name: '蓝色', value: '#3B82F6'},
  {name: '紫色', value: '#A855F7'},
  {name: '粉色', value: '#EC4899'},
  {name: '灰色', value: '#6B7280'},
  {name: '棕色', value: '#92400E'}
]

export default function ColorPicker({selectedColor, onColorSelect}: ColorPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {PRESET_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${
            selectedColor === color.value ? 'ring-4 ring-primary scale-110' : 'hover:scale-105'
          }`}
          style={{backgroundColor: color.value}}
          onClick={() => onColorSelect(color.value)}
          aria-label={color.name}>
          {selectedColor === color.value && (
            <div className="i-mdi-check text-3xl text-white" />
          )}
        </button>
      ))}
    </div>
  )
}
