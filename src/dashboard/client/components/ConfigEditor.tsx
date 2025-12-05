/**
 * 配置编辑器组件
 * 可视化编辑 Launcher 配置
 */
import React, { useState } from 'react'

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'array'
  value: unknown
  description?: string
  options?: { label: string; value: string | number }[]
  min?: number
  max?: number
  placeholder?: string
}

interface ConfigEditorProps {
  title: string
  fields: ConfigField[]
  onChange: (key: string, value: unknown) => void
  onSave?: () => void
  onReset?: () => void
  saving?: boolean
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({
  title,
  fields,
  onChange,
  onSave,
  onReset,
  saving,
}) => {
  const renderField = (field: ConfigField) => {
    const baseInputClass =
      'w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors'

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={String(field.value || '')}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={Number(field.value) || 0}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
            min={field.min}
            max={field.max}
            className={baseInputClass}
          />
        )

      case 'boolean':
        return (
          <button
            onClick={() => onChange(field.key, !field.value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              field.value ? 'bg-cyan-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                field.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )

      case 'select':
        return (
          <select
            value={String(field.value)}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={baseInputClass}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'array':
        const arrayValue = Array.isArray(field.value) ? field.value : []
        return (
          <div className="space-y-2">
            {arrayValue.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={String(item)}
                  onChange={(e) => {
                    const newArray = [...arrayValue]
                    newArray[index] = e.target.value
                    onChange(field.key, newArray)
                  }}
                  className={`${baseInputClass} flex-1`}
                />
                <button
                  onClick={() => {
                    const newArray = arrayValue.filter((_, i) => i !== index)
                    onChange(field.key, newArray)
                  }}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange(field.key, [...arrayValue, ''])}
              className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              + Add Item
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">{title}</h3>
        <div className="flex gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              Reset
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">{field.label}</span>
              <span className="text-xs text-gray-500 font-mono">{field.key}</span>
            </label>
            {field.description && (
              <p className="text-xs text-gray-500 mb-2">{field.description}</p>
            )}
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Launcher 配置预设
 */
export const launcherConfigFields: ConfigField[] = [
  {
    key: 'port',
    label: 'Dev Server Port',
    type: 'number',
    value: 3000,
    description: 'Development server port number',
    min: 1024,
    max: 65535,
  },
  {
    key: 'host',
    label: 'Host',
    type: 'text',
    value: 'localhost',
    description: 'Development server host',
    placeholder: 'localhost or 0.0.0.0',
  },
  {
    key: 'open',
    label: 'Auto Open Browser',
    type: 'boolean',
    value: true,
    description: 'Automatically open browser on server start',
  },
  {
    key: 'https',
    label: 'Enable HTTPS',
    type: 'boolean',
    value: false,
    description: 'Use HTTPS for development server',
  },
  {
    key: 'strictPort',
    label: 'Strict Port',
    type: 'boolean',
    value: false,
    description: 'Exit if port is already in use',
  },
  {
    key: 'logLevel',
    label: 'Log Level',
    type: 'select',
    value: 'info',
    options: [
      { label: 'Silent', value: 'silent' },
      { label: 'Error', value: 'error' },
      { label: 'Warn', value: 'warn' },
      { label: 'Info', value: 'info' },
      { label: 'Debug', value: 'debug' },
    ],
  },
  {
    key: 'clearScreen',
    label: 'Clear Screen',
    type: 'boolean',
    value: true,
    description: 'Clear terminal screen on server start',
  },
]

/**
 * 配置面板
 */
interface ConfigPanelProps {
  projectId: string
  initialConfig?: Record<string, unknown>
  onConfigChange?: (config: Record<string, unknown>) => void
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  projectId,
  initialConfig = {},
  onConfigChange,
}) => {
  const [config, setConfig] = useState<Record<string, unknown>>(initialConfig)
  const [saving, setSaving] = useState(false)

  const handleChange = (key: string, value: unknown) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 调用 API 保存配置
      await fetch(`/api/config/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      onConfigChange?.(config)
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(initialConfig)
  }

  const fields = launcherConfigFields.map((field) => ({
    ...field,
    value: config[field.key] ?? field.value,
  }))

  return (
    <ConfigEditor
      title="Launcher Configuration"
      fields={fields}
      onChange={handleChange}
      onSave={handleSave}
      onReset={handleReset}
      saving={saving}
    />
  )
}

export default ConfigEditor
