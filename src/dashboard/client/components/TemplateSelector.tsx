/**
 * 模板选择器组件
 * 用于选择项目模板创建新项目
 */
import React, { useState } from 'react'

export interface Template {
  id: string
  name: string
  description: string
  icon: string
  framework: string
}

interface TemplateSelectorProps {
  templates: Template[]
  onSelect: (template: Template) => void
  selected?: string
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSelect,
  selected,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className={`p-4 rounded-lg text-left transition-all ${
            selected === template.id
              ? 'bg-cyan-600 ring-2 ring-cyan-400'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          <span className="text-3xl mb-2 block">{template.icon}</span>
          <h4 className="font-semibold text-white">{template.name}</h4>
          <p className="text-sm text-gray-400 mt-1">{template.description}</p>
        </button>
      ))}
    </div>
  )
}

/**
 * 创建项目模态框
 */
interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { template: string; name: string; directory: string }) => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [projectName, setProjectName] = useState('')
  const [directory, setDirectory] = useState('')
  const [creating, setCreating] = useState(false)

  const templates: Template[] = [
    { id: 'vue3', name: 'Vue 3', description: 'Vue 3 + TypeScript', icon: '🟢', framework: 'vue3' },
    { id: 'react', name: 'React', description: 'React 18 + TypeScript', icon: '⚛️', framework: 'react' },
    { id: 'svelte', name: 'Svelte', description: 'Svelte 4 + TypeScript', icon: '🔥', framework: 'svelte' },
    { id: 'solid', name: 'Solid', description: 'SolidJS + TypeScript', icon: '💎', framework: 'solid' },
    { id: 'preact', name: 'Preact', description: 'Preact + TypeScript', icon: '⚡', framework: 'preact' },
    { id: 'vanilla', name: 'Vanilla', description: 'Vanilla TypeScript', icon: '🌟', framework: 'vanilla' },
  ]

  const handleCreate = async () => {
    if (!selectedTemplate || !projectName) return
    
    setCreating(true)
    try {
      await onCreate({
        template: selectedTemplate,
        name: projectName,
        directory: directory || process.cwd?.() || '.',
      })
      onClose()
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setSelectedTemplate('')
    setProjectName('')
    setDirectory('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4 p-4 border-b border-gray-800">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-cyan-600' : 'bg-gray-700'
              }`}>
                {s}
              </div>
              <span className={step >= s ? 'text-white' : 'text-gray-500'}>
                {s === 1 ? 'Select Template' : 'Project Details'}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {step === 1 && (
            <TemplateSelector
              templates={templates}
              selected={selectedTemplate}
              onSelect={(t) => setSelectedTemplate(t.id)}
            />
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-awesome-project"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Directory (optional)
                </label>
                <input
                  type="text"
                  value={directory}
                  onChange={(e) => setDirectory(e.target.value)}
                  placeholder="Leave empty for current directory"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-4 border-t border-gray-700">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!selectedTemplate}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!projectName || creating}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateSelector
