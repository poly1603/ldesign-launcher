/**
 * Dashboard 主应用组件
 */
import React, { useState, useEffect } from 'react'
import { useWebSocket, type ProjectStatus } from './hooks/useWebSocket'
import type { PerformanceDataPoint } from './components/PerformanceChart'
import { useTheme, type Theme } from './hooks/useTheme'
import { ProjectCard } from './components/ProjectCard'
import { Console } from './components/Console'
import { PerformancePanel } from './components/PerformanceChart'
import { ConfigPanel } from './components/ConfigEditor'
import { CreateProjectModal } from './components/TemplateSelector'
import { Settings } from './pages/Settings'

const App: React.FC = () => {
  const {
    connected,
    projects,
    logs,
    startProject,
    stopProject,
    restartProject,
    buildProject,
    clearLogs,
  } = useWebSocket()

  const { theme, setTheme, isDark, toggleTheme } = useTheme()

  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'projects' | 'performance' | 'settings'>('projects')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([])

  const selectedProjectData = projects.find((p) => p.id === selectedProject)

  // 模拟性能数据
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceData(prev => [
        ...prev.slice(-59),
        {
          timestamp: Date.now(),
          memory: Math.random() * 100 * 1024 * 1024 + 50 * 1024 * 1024,
        }
      ])
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCreateProject = async (data: { template: string; name: string; directory: string }) => {
    try {
      await fetch('/api/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      // 刷新项目列表
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="text-xl font-bold">LDesign Launcher</h1>
              <p className="text-sm text-gray-400">Dashboard v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              {connected ? 'Connected' : 'Disconnected'}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Toggle theme"
            >
              {isDark ? '🌙' : '☀️'}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 min-h-[calc(100vh-73px)] border-r border-gray-700 p-4">
          <nav className="space-y-2">
            <button
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'projects' ? 'bg-cyan-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('projects')}
            >
              📊 Projects
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'performance' ? 'bg-cyan-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('performance')}
            >
              📈 Performance
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-cyan-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              🔧 Settings
            </button>
          </nav>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-sm text-gray-400">Running</p>
                <p className="text-2xl font-bold text-green-400">
                  {projects.filter((p) => p.status === 'running').length}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-sm text-gray-400">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Projects List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Projects</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    + Add Project
                  </button>
                </div>
                <div className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-8 text-center">
                      <p className="text-gray-400 mb-4">No projects found</p>
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
                        Scan Directory
                      </button>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        selected={selectedProject === project.id}
                        onSelect={() => setSelectedProject(project.id)}
                        onStart={() => startProject(project.id)}
                        onStop={() => stopProject(project.id)}
                        onRestart={() => restartProject(project.id)}
                        onBuild={() => buildProject(project.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  {selectedProjectData ? selectedProjectData.name : 'Select a Project'}
                </h2>
                {selectedProjectData ? (
                  <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                    <div>
                      <h3 className="text-sm text-gray-400 mb-2">Details</h3>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-gray-500">Framework:</dt>
                        <dd>{selectedProjectData.framework}</dd>
                        <dt className="text-gray-500">Status:</dt>
                        <dd className={selectedProjectData.status === 'running' ? 'text-green-400' : 'text-gray-400'}>
                          {selectedProjectData.status}
                        </dd>
                        <dt className="text-gray-500">Path:</dt>
                        <dd className="truncate" title={selectedProjectData.path}>
                          {selectedProjectData.path}
                        </dd>
                        {selectedProjectData.port && (
                          <>
                            <dt className="text-gray-500">Port:</dt>
                            <dd>
                              <a
                                href={`http://localhost:${selectedProjectData.port}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:underline"
                              >
                                {selectedProjectData.port}
                              </a>
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
                    Click a project to view details
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <PerformancePanel
              data={performanceData}
              systemInfo={{
                uptime: 3600,
                nodeVersion: 'v20.0.0',
                platform: 'win32',
              }}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Settings theme={theme} onThemeChange={setTheme} />
          )}

          {/* Console */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Console</h2>
            <Console logs={logs} onClear={clearLogs} maxHeight="300px" />
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  )
}

export default App
