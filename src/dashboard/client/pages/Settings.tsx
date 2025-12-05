/**
 * 设置页面
 */
import React from 'react'
import type { Theme } from '../hooks/useTheme'

interface SettingsProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export const Settings: React.FC<SettingsProps> = ({ theme, onThemeChange }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* 主题设置 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Appearance</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Theme</label>
            <div className="flex gap-3">
              {(['dark', 'light', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onThemeChange(t)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    theme === t
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-xl">
                      {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '💻'}
                    </span>
                    <span className="capitalize">{t}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 开发服务器设置 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Development Server</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-refresh on config change</p>
              <p className="text-sm text-gray-400">Automatically restart server when config changes</p>
            </div>
            <button className="w-12 h-6 bg-cyan-600 rounded-full relative">
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show QR Code</p>
              <p className="text-sm text-gray-400">Display QR code for mobile access</p>
            </div>
            <button className="w-12 h-6 bg-cyan-600 rounded-full relative">
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clear console on restart</p>
              <p className="text-sm text-gray-400">Clear terminal output when server restarts</p>
            </div>
            <button className="w-12 h-6 bg-gray-600 rounded-full relative">
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Notifications</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Build notifications</p>
              <p className="text-sm text-gray-400">Show notification when build completes</p>
            </div>
            <button className="w-12 h-6 bg-cyan-600 rounded-full relative">
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Error notifications</p>
              <p className="text-sm text-gray-400">Show notification on build errors</p>
            </div>
            <button className="w-12 h-6 bg-cyan-600 rounded-full relative">
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>
        </div>
      </div>

      {/* 关于 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">About</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Version</span>
            <span>2.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Vite</span>
            <span>5.4.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Node.js</span>
            <span>{typeof process !== 'undefined' ? process.version : 'N/A'}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <a
            href="https://github.com/ldesign/launcher"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </div>
  )
}

export default Settings
