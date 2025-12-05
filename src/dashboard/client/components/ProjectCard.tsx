/**
 * 项目卡片组件
 */
import React from 'react'
import type { ProjectStatus } from '../hooks/useWebSocket'

interface ProjectCardProps {
  project: ProjectStatus
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onBuild: () => void
  onSelect: () => void
  selected?: boolean
}

const frameworkIcons: Record<string, string> = {
  vue3: '🟢',
  vue2: '🟢',
  react: '⚛️',
  svelte: '🔥',
  solid: '💎',
  preact: '⚡',
  angular: '🅰️',
  astro: '🚀',
  remix: '💿',
  vanilla: '🌟',
}

const statusColors: Record<string, string> = {
  running: 'bg-green-500',
  stopped: 'bg-gray-500',
  building: 'bg-yellow-500',
  error: 'bg-red-500',
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onStart,
  onStop,
  onRestart,
  onBuild,
  onSelect,
  selected,
}) => {
  const icon = frameworkIcons[project.framework] || '📦'
  const statusColor = statusColors[project.status] || 'bg-gray-500'

  return (
    <div
      className={`
        bg-gray-800 rounded-lg p-4 cursor-pointer transition-all
        ${selected ? 'ring-2 ring-cyan-500' : 'hover:bg-gray-750'}
      `}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-white">{project.name}</h3>
            <p className="text-xs text-gray-400">{project.framework}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusColor}`} title={project.status} />
      </div>

      {/* Info */}
      <div className="text-sm text-gray-400 mb-3 space-y-1">
        {project.port && (
          <p>
            Port: <span className="text-cyan-400">{project.port}</span>
          </p>
        )}
        {project.memory && (
          <p>
            Memory: <span className="text-cyan-400">{(project.memory / 1024 / 1024).toFixed(1)}MB</span>
          </p>
        )}
        {project.buildTime && (
          <p>
            Build: <span className="text-cyan-400">{project.buildTime}ms</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {project.status === 'stopped' ? (
          <button
            className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onStart()
            }}
          >
            ▶️ Start
          </button>
        ) : (
          <button
            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onStop()
            }}
          >
            ⏹️ Stop
          </button>
        )}
        <button
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onRestart()
          }}
          title="Restart"
        >
          🔄
        </button>
        <button
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onBuild()
          }}
          title="Build"
        >
          📦
        </button>
      </div>
    </div>
  )
}

export default ProjectCard
