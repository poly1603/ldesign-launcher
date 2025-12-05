/**
 * 性能图表组件
 * 显示内存、CPU、请求数等实时性能数据
 */
import React, { useEffect, useRef, useState } from 'react'

export interface PerformanceDataPoint {
  timestamp: number
  memory: number
  cpu?: number
  requests?: number
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[]
  maxPoints?: number
  height?: number
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  maxPoints = 60,
  height = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height,
        })
      }
    })

    resizeObserver.observe(canvas.parentElement!)
    return () => resizeObserver.disconnect()
  }, [height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置 canvas 尺寸
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 获取最近的数据点
    const points = data.slice(-maxPoints)
    if (points.length < 2) return

    // 计算最大值
    const maxMemory = Math.max(...points.map((p) => p.memory), 1)

    // 绘制网格
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = (canvas.height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // 绘制内存曲线
    const drawLine = (
      values: number[],
      color: string,
      maxValue: number
    ) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()

      values.forEach((value, index) => {
        const x = (index / (values.length - 1)) * canvas.width
        const y = canvas.height - (value / maxValue) * canvas.height * 0.9

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // 绘制填充渐变
      ctx.lineTo(canvas.width, canvas.height)
      ctx.lineTo(0, canvas.height)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'))
      gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'))
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // 绘制内存线
    drawLine(
      points.map((p) => p.memory),
      'rgb(34, 211, 238)',
      maxMemory
    )
  }, [data, dimensions, maxPoints])

  const latestData = data[data.length - 1]
  const formatMemory = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Performance</h3>
        {latestData && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span className="text-gray-400">Memory:</span>
              <span className="text-cyan-400 font-mono">
                {formatMemory(latestData.memory)}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="relative" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height }}
        />
      </div>
    </div>
  )
}

/**
 * 性能统计卡片
 */
interface StatCardProps {
  icon: string
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  color?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
  color = 'cyan',
}) => {
  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  }

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-gray-400',
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
        {trend && (
          <span className={`text-xs ${trendColors[trend]}`}>
            {trendIcons[trend]}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold text-${color}-400`}>{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  )
}

/**
 * 性能面板
 */
interface PerformancePanelProps {
  data: PerformanceDataPoint[]
  systemInfo?: {
    uptime: number
    nodeVersion: string
    platform: string
  }
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  data,
  systemInfo,
}) => {
  const latestData = data[data.length - 1]
  const avgMemory = data.length > 0
    ? data.reduce((sum, d) => sum + d.memory, 0) / data.length
    : 0

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="💾"
          label="Memory Usage"
          value={latestData ? (latestData.memory / 1024 / 1024).toFixed(1) : '0'}
          unit="MB"
          color="cyan"
        />
        <StatCard
          icon="📊"
          label="Avg Memory"
          value={(avgMemory / 1024 / 1024).toFixed(1)}
          unit="MB"
          color="purple"
        />
        {systemInfo && (
          <>
            <StatCard
              icon="⏱️"
              label="Uptime"
              value={formatUptime(systemInfo.uptime)}
              color="green"
            />
            <StatCard
              icon="🖥️"
              label="Node.js"
              value={systemInfo.nodeVersion}
              color="yellow"
            />
          </>
        )}
      </div>

      {/* Chart */}
      <PerformanceChart data={data} height={150} />
    </div>
  )
}

export default PerformanceChart
