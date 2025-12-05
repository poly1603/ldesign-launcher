/**
 * 构建进度组件
 * 显示实时构建进度和阶段
 */
import React from 'react'

export interface BuildPhase {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  duration?: number
  message?: string
}

interface BuildProgressProps {
  projectId: string
  projectName: string
  phases: BuildPhase[]
  progress: number
  isBuilding: boolean
  onCancel?: () => void
}

const phaseIcons: Record<string, string> = {
  init: '🔧',
  transform: '⚙️',
  bundle: '📦',
  optimize: '🚀',
  write: '💾',
  done: '✅',
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-600',
  running: 'bg-cyan-500 animate-pulse',
  completed: 'bg-green-500',
  error: 'bg-red-500',
}

export const BuildProgress: React.FC<BuildProgressProps> = ({
  projectName,
  phases,
  progress,
  isBuilding,
  onCancel,
}) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const totalDuration = phases
    .filter((p) => p.duration)
    .reduce((sum, p) => sum + (p.duration || 0), 0)

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <div>
            <h3 className="font-semibold text-white">{projectName}</h3>
            <p className="text-xs text-gray-400">
              {isBuilding ? 'Building...' : 'Build Complete'}
            </p>
          </div>
        </div>
        {isBuilding && onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isBuilding ? 'bg-cyan-500' : 'bg-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-2">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className={`flex items-center gap-3 p-2 rounded ${
              phase.status === 'running' ? 'bg-gray-700' : ''
            }`}
          >
            {/* Status Indicator */}
            <div className={`w-3 h-3 rounded-full ${statusColors[phase.status]}`} />

            {/* Phase Icon */}
            <span className="text-lg">{phaseIcons[phase.id] || '📋'}</span>

            {/* Phase Name */}
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{phase.name}</p>
              {phase.message && (
                <p className="text-xs text-gray-400 truncate">{phase.message}</p>
              )}
            </div>

            {/* Duration */}
            {phase.duration !== undefined && (
              <span className="text-xs text-gray-400">
                {formatDuration(phase.duration)}
              </span>
            )}

            {/* Step Number */}
            <span className="text-xs text-gray-500">
              {index + 1}/{phases.length}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      {!isBuilding && totalDuration > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Build Time</span>
            <span className="text-green-400 font-medium">
              {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 构建进度列表组件
 */
interface BuildListProps {
  builds: Array<{
    projectId: string
    projectName: string
    phases: BuildPhase[]
    progress: number
    isBuilding: boolean
    startTime: number
  }>
  onCancelBuild?: (projectId: string) => void
}

export const BuildList: React.FC<BuildListProps> = ({ builds, onCancelBuild }) => {
  if (builds.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No active builds</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {builds.map((build) => (
        <BuildProgress
          key={build.projectId}
          projectId={build.projectId}
          projectName={build.projectName}
          phases={build.phases}
          progress={build.progress}
          isBuilding={build.isBuilding}
          onCancel={onCancelBuild ? () => onCancelBuild(build.projectId) : undefined}
        />
      ))}
    </div>
  )
}

export default BuildProgress
