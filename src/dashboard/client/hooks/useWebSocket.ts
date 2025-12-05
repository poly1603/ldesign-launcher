/**
 * WebSocket Hook
 * 用于连接 Dashboard 后端并接收实时数据
 */
import { useState, useEffect, useCallback, useRef } from 'react'

export interface WSMessage {
  type: 'log' | 'status' | 'performance' | 'error' | 'project' | 'build'
  payload: unknown
  timestamp: number
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  projectId?: string
  timestamp: number
}

export interface ProjectStatus {
  id: string
  name: string
  path: string
  framework: string
  status: 'running' | 'stopped' | 'building' | 'error'
  port?: number
  pid?: number
  startTime?: number
  buildTime?: number
  memory?: number
}

interface UseWebSocketReturn {
  connected: boolean
  projects: ProjectStatus[]
  logs: LogEntry[]
  sendMessage: (action: string, payload?: unknown) => void
  startProject: (projectId: string) => void
  stopProject: (projectId: string) => void
  restartProject: (projectId: string) => void
  buildProject: (projectId: string) => void
  clearLogs: () => void
}

export function useWebSocket(url?: string): UseWebSocketReturn {
  const [connected, setConnected] = useState(false)
  const [projects, setProjects] = useState<ProjectStatus[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const wsUrl = url || `ws://${window.location.host}/ws`

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WS] Connected')
      setConnected(true)
      // 请求项目列表
      ws.send(JSON.stringify({ action: 'getProjects' }))
    }

    ws.onclose = () => {
      console.log('[WS] Disconnected')
      setConnected(false)
      // 自动重连
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = (error) => {
      console.error('[WS] Error:', error)
    }

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)
        handleMessage(message)
      } catch (error) {
        console.error('[WS] Parse error:', error)
      }
    }

    wsRef.current = ws
  }, [wsUrl])

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'status':
        if (message.payload && typeof message.payload === 'object') {
          const payload = message.payload as { projects?: ProjectStatus[] }
          if (payload.projects) {
            setProjects(payload.projects)
          }
        }
        break

      case 'project':
        if (message.payload && typeof message.payload === 'object') {
          const project = message.payload as ProjectStatus & { removed?: boolean }
          if (project.removed) {
            setProjects((prev) => prev.filter((p) => p.id !== project.id))
          } else {
            setProjects((prev) => {
              const index = prev.findIndex((p) => p.id === project.id)
              if (index >= 0) {
                const updated = [...prev]
                updated[index] = project
                return updated
              }
              return [...prev, project]
            })
          }
        }
        break

      case 'log':
        if (message.payload && typeof message.payload === 'object') {
          const log = message.payload as Omit<LogEntry, 'timestamp'>
          setLogs((prev) => [
            ...prev.slice(-999), // 保留最近1000条
            { ...log, timestamp: message.timestamp },
          ])
        }
        break

      case 'performance':
        // 处理性能数据
        break

      case 'build':
        // 处理构建进度
        break

      case 'error':
        console.error('[WS] Server error:', message.payload)
        break
    }
  }, [])

  const sendMessage = useCallback((action: string, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }))
    }
  }, [])

  const startProject = useCallback(
    (projectId: string) => sendMessage('startProject', { projectId }),
    [sendMessage]
  )

  const stopProject = useCallback(
    (projectId: string) => sendMessage('stopProject', { projectId }),
    [sendMessage]
  )

  const restartProject = useCallback(
    (projectId: string) => sendMessage('restartProject', { projectId }),
    [sendMessage]
  )

  const buildProject = useCallback(
    (projectId: string) => sendMessage('buildProject', { projectId }),
    [sendMessage]
  )

  const clearLogs = useCallback(() => setLogs([]), [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  return {
    connected,
    projects,
    logs,
    sendMessage,
    startProject,
    stopProject,
    restartProject,
    buildProject,
    clearLogs,
  }
}
