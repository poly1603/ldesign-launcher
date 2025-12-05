/**
 * 实时控制台组件
 */
import React, { useEffect, useRef } from 'react'
import type { LogEntry } from '../hooks/useWebSocket'

interface ConsoleProps {
  logs: LogEntry[]
  onClear: () => void
  maxHeight?: string
}

const levelStyles: Record<string, string> = {
  info: 'text-cyan-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  debug: 'text-gray-500',
}

const levelIcons: Record<string, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  debug: '🔍',
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClear, maxHeight = '400px' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  // 自动滚动到底部
  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  // 检测用户是否手动滚动
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-green-400">●</span>
          <span className="text-sm font-medium text-gray-300">Console</span>
          <span className="text-xs text-gray-500">({logs.length} entries)</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Log Content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto font-mono text-sm"
        style={{ maxHeight }}
      >
        {logs.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">No logs yet...</div>
        ) : (
          <div className="p-2 space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 px-2 py-1 rounded hover:bg-gray-800 ${levelStyles[log.level]}`}
              >
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  {formatTime(log.timestamp)}
                </span>
                <span className="w-4">{levelIcons[log.level]}</span>
                {log.projectId && (
                  <span className="text-purple-400 text-xs">[{log.projectId}]</span>
                )}
                <span className="flex-1 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Console
