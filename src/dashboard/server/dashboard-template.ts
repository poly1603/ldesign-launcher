/**
 * Dashboard HTML 模板
 * 后台管理系统风格界面 - 使用 Lucide 图标
 */

export function getDashboardTemplate(projectName: string, cwd: string): string {
  const cwdPath = cwd.replace(/\\/g, '/')
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LDesign Launcher Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              50: 'var(--primary-50)',
              100: 'var(--primary-100)',
              200: 'var(--primary-200)',
              300: 'var(--primary-300)',
              400: 'var(--primary-400)',
              500: 'var(--primary-500)',
              600: 'var(--primary-600)',
              700: 'var(--primary-700)',
              800: 'var(--primary-800)',
              900: 'var(--primary-900)',
            }
          }
        }
      }
    }
  </script>
  <style>
    :root {
      --primary-50: #ecfeff;
      --primary-100: #cffafe;
      --primary-200: #a5f3fc;
      --primary-300: #67e8f9;
      --primary-400: #22d3ee;
      --primary-500: #06b6d4;
      --primary-600: #0891b2;
      --primary-700: #0e7490;
      --primary-800: #155e75;
      --primary-900: #164e63;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; transition: all 0.3s ease; }
    .sidebar { width: 260px; transition: all 0.3s ease; }
    .main-content { margin-left: 260px; transition: all 0.3s ease; }
    .scrollbar::-webkit-scrollbar { width: 6px; }
    .dark .scrollbar::-webkit-scrollbar-track { background: #1e293b; }
    .dark .scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
    .light .scrollbar::-webkit-scrollbar-track { background: #e2e8f0; }
    .light .scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-pulse { animation: pulse 2s infinite; }
    .animate-spin { animation: spin 1s linear infinite; }
    .env-tab { transition: all 0.2s; cursor: pointer; }
    .env-tab.active { background: var(--primary-500) !important; color: white; }
    .menu-item { transition: all 0.15s; }
    .menu-item.active { background: var(--primary-500); color: white; }
    .dark .menu-item:not(.active):hover { background: #334155; }
    .light .menu-item:not(.active):hover { background: #e2e8f0; }
    .dark .env-tab:not(.active):hover { background: #334155; }
    .light .env-tab:not(.active):hover { background: #e2e8f0; }
    /* 主题色选项 */
    .color-option { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; transition: transform 0.2s; border: 2px solid transparent; }
    .color-option:hover { transform: scale(1.15); }
    .color-option.active { border-color: white; box-shadow: 0 0 0 2px var(--primary-500); }
    /* 卡片样式 */
    .card { transition: all 0.3s ease; }
    .dark .card { background: #1e293b; border: 1px solid #334155; }
    .light .card { background: white; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    /* 输入框样式 */
    .dark .input-field { background: #334155; border-color: #475569; color: white; }
    .light .input-field { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
    .input-field:focus { border-color: var(--primary-500) !important; outline: none; box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1); }
    /* 按钮样式 */
    .btn-primary { background: var(--primary-500); transition: all 0.2s; }
    .btn-primary:hover { background: var(--primary-600); transform: translateY(-1px); }
    .btn-secondary { transition: all 0.2s; }
    .dark .btn-secondary { background: #334155; }
    .light .btn-secondary { background: #e2e8f0; color: #475569; }
    .btn-secondary:hover { opacity: 0.9; }
    /* 控制台样式 */
    .console { font-family: 'Fira Code', 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.6; }
    .dark .console { background: #0f172a; }
    .light .console { background: #f1f5f9; color: #334155; }
    /* 状态徽章 */
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 500; }
    .dark .status-badge { background: #1e293b; }
    .light .status-badge { background: #f1f5f9; }
    /* 提示文字 */
    .dark .text-muted { color: #94a3b8; }
    .light .text-muted { color: #64748b; }
    /* 分割线 */
    .dark .divider { border-color: #334155; }
    .light .divider { border-color: #e2e8f0; }
  </style>
</head>
<body class="dark bg-slate-900 text-white">
  <!-- Toast 通知容器 -->
  <div id="toast-container" class="fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>
  
  <div class="flex min-h-screen">
    <!-- 左侧菜单 -->
    <aside id="sidebar" class="sidebar fixed h-full bg-slate-800 dark:bg-slate-800 light:bg-white border-r border-slate-700 dark:border-slate-700 light:border-slate-200 flex flex-col z-50">
      <div class="p-4 border-b border-slate-700 dark:border-slate-700 light:border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <i data-lucide="rocket" class="w-5 h-5"></i>
          </div>
          <div>
            <h1 class="font-bold text-lg">Launcher</h1>
            <p class="text-xs text-slate-400">Dashboard v2.0</p>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-b border-slate-700">
        <p class="text-xs text-slate-500 mb-1">当前项目</p>
        <p class="font-medium truncate" title="${projectName}">${projectName}</p>
        <p class="text-xs text-slate-500 truncate mt-1" title="${cwdPath}">${cwdPath}</p>
        <div class="flex items-center gap-2 mt-2">
          <i data-lucide="box" class="w-4 h-4 text-cyan-400" id="framework-icon"></i>
          <span class="text-sm text-slate-400" id="framework-name">检测中...</span>
        </div>
      </div>
      
      <nav class="flex-1 p-3 space-y-1">
        <p class="text-xs text-slate-500 px-3 py-2">操作</p>
        <button onclick="switchPage('dev')" id="menu-dev" class="menu-item active w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left">
          <i data-lucide="play" class="w-4 h-4"></i> 开发服务器
        </button>
        <button onclick="switchPage('build')" id="menu-build" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="package" class="w-4 h-4"></i> 构建打包
        </button>
        <button onclick="switchPage('preview')" id="menu-preview" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="eye" class="w-4 h-4"></i> 预览服务
        </button>
        <button onclick="switchPage('deploy')" id="menu-deploy" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="cloud-upload" class="w-4 h-4"></i> 项目部署
        </button>
        
        <p class="text-xs text-slate-500 px-3 py-2 mt-4">工具</p>
        <button onclick="switchPage('tools')" id="menu-tools" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="wrench" class="w-4 h-4"></i> 工具箱
        </button>
        <button onclick="switchPage('analyze')" id="menu-analyze" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="pie-chart" class="w-4 h-4"></i> 项目分析
        </button>
        
        <p class="text-xs text-slate-500 px-3 py-2 mt-4">配置</p>
        <button onclick="switchPage('launcher-config')" id="menu-launcher-config" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="settings" class="w-4 h-4"></i> Launcher 配置
        </button>
        <button onclick="switchPage('app-config')" id="menu-app-config" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="smartphone" class="w-4 h-4"></i> App 配置
        </button>
      </nav>
      
      <!-- 主题设置 -->
      <div class="p-4 border-t border-slate-700 dark:border-slate-700">
        <p class="text-xs text-slate-500 mb-3">主题设置</p>
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-slate-400">外观模式</span>
          <button onclick="toggleTheme()" id="theme-toggle" class="flex items-center gap-2 px-3 py-1.5 bg-slate-700 dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-600 transition-colors">
            <i data-lucide="moon" class="w-4 h-4" id="theme-icon"></i>
            <span id="theme-text">暗色</span>
          </button>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">主题色</span>
          <div class="flex gap-2">
            <button onclick="setThemeColor('cyan')" class="color-option active" style="background: #06b6d4;" title="青色"></button>
            <button onclick="setThemeColor('blue')" class="color-option" style="background: #3b82f6;" title="蓝色"></button>
            <button onclick="setThemeColor('violet')" class="color-option" style="background: #8b5cf6;" title="紫色"></button>
            <button onclick="setThemeColor('rose')" class="color-option" style="background: #f43f5e;" title="玫红"></button>
            <button onclick="setThemeColor('emerald')" class="color-option" style="background: #10b981;" title="绿色"></button>
            <button onclick="setThemeColor('amber')" class="color-option" style="background: #f59e0b;" title="琥珀"></button>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-slate-700 dark:border-slate-700">
        <div id="ws-status" class="flex items-center gap-2 text-sm">
          <span class="w-2 h-2 rounded-full bg-yellow-400"></span>
          <span class="text-slate-400">连接中...</span>
        </div>
      </div>
    </aside>

    <main class="main-content flex-1 min-h-screen">
      <!-- 开发服务器页面 -->
      <div id="page-dev" class="page p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="play-circle" class="w-6 h-6 text-green-400"></i> 开发服务器</h2>
            <p class="text-slate-400 mt-1">启动本地开发环境，支持热更新</p>
          </div>
          <div id="dev-status" class="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800">
            <span class="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>未运行</span>
          </div>
        </div>
        
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">端口</label>
            <input type="number" id="dev-port" value="3000" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
          </div>
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">主机</label>
            <input type="text" id="dev-host" value="localhost" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
          </div>
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">自动打开浏览器</label>
            <select id="dev-open" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
          </div>
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">HTTPS</label>
            <select id="dev-https" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
              <option value="false">否</option>
              <option value="true">是</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-3 mb-6">
          <button id="btn-start-dev" onclick="startDev()" class="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors">
            <i data-lucide="play" class="w-4 h-4"></i> 启动服务器
          </button>
          <button id="btn-stop-dev" onclick="stopDev()" class="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors hidden">
            <i data-lucide="square" class="w-4 h-4"></i> 停止服务器
          </button>
          <button onclick="openInBrowser()" class="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <i data-lucide="external-link" class="w-4 h-4"></i> 在浏览器中打开
          </button>
        </div>
        
        <div class="bg-slate-800 rounded-lg">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span class="font-medium flex items-center gap-2"><i data-lucide="terminal" class="w-4 h-4"></i> 控制台输出</span>
            <button onclick="clearLog('dev')" class="text-sm text-slate-400 hover:text-white flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3 h-3"></i> 清空
            </button>
          </div>
          <div id="dev-console" class="h-72 overflow-y-auto p-4 font-mono text-sm scrollbar">
            <div class="text-slate-500">[等待启动...]</div>
          </div>
        </div>
      </div>

      <!-- 构建页面 -->
      <div id="page-build" class="page p-6 hidden">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="package" class="w-6 h-6 text-blue-400"></i> 构建打包</h2>
            <p class="text-slate-400 mt-1">编译项目并输出生产环境代码</p>
          </div>
          <div id="build-status" class="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800">
            <span class="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>就绪</span>
          </div>
        </div>
        
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">输出目录</label>
            <input type="text" id="build-outdir" value="dist" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
          </div>
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">模式</label>
            <select id="build-mode" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
              <option value="production">Production</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">Source Map</label>
            <select id="build-sourcemap" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
              <option value="false">关闭</option>
              <option value="true">开启</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">代码压缩</label>
            <select id="build-minify" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
              <option value="esbuild">ESBuild</option>
              <option value="terser">Terser</option>
              <option value="false">关闭</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-3 mb-6">
          <button id="btn-build" onclick="startBuild()" class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors">
            <i data-lucide="hammer" class="w-4 h-4"></i> 开始构建
          </button>
          <button onclick="openDistFolder()" class="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <i data-lucide="folder-open" class="w-4 h-4"></i> 打开输出目录
          </button>
        </div>
        
        <div id="build-progress" class="bg-slate-800 rounded-lg p-4 mb-6 hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 构建进度</span>
            <span id="build-percent">0%</span>
          </div>
          <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div id="build-bar" class="h-full bg-blue-500 transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>
        
        <div class="bg-slate-800 rounded-lg">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span class="font-medium flex items-center gap-2"><i data-lucide="terminal" class="w-4 h-4"></i> 构建日志</span>
            <button onclick="clearLog('build')" class="text-sm text-slate-400 hover:text-white flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3 h-3"></i> 清空
            </button>
          </div>
          <div id="build-console" class="h-72 overflow-y-auto p-4 font-mono text-sm scrollbar">
            <div class="text-slate-500">[等待构建...]</div>
          </div>
        </div>
      </div>

      <!-- 预览页面 -->
      <div id="page-preview" class="page p-6 hidden">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="eye" class="w-6 h-6 text-purple-400"></i> 预览服务</h2>
            <p class="text-slate-400 mt-1">预览生产环境构建结果</p>
          </div>
          <div id="preview-status" class="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800">
            <span class="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>未运行</span>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">预览端口</label>
            <input type="number" id="preview-port" value="4173" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
          </div>
          <div class="bg-slate-800 rounded-lg p-4">
            <label class="block text-sm text-slate-400 mb-2">预览目录</label>
            <input type="text" id="preview-dir" value="dist" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
          </div>
        </div>
        
        <div class="flex gap-3 mb-6">
          <button id="btn-start-preview" onclick="startPreview()" class="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors">
            <i data-lucide="play" class="w-4 h-4"></i> 启动预览
          </button>
          <button id="btn-stop-preview" onclick="stopPreview()" class="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors hidden">
            <i data-lucide="square" class="w-4 h-4"></i> 停止预览
          </button>
          <button onclick="openPreviewInBrowser()" class="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <i data-lucide="external-link" class="w-4 h-4"></i> 在浏览器中打开
          </button>
        </div>
        
        <div class="bg-slate-800 rounded-lg">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span class="font-medium flex items-center gap-2"><i data-lucide="terminal" class="w-4 h-4"></i> 预览日志</span>
            <button onclick="clearLog('preview')" class="text-sm text-slate-400 hover:text-white flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3 h-3"></i> 清空
            </button>
          </div>
          <div id="preview-console" class="h-72 overflow-y-auto p-4 font-mono text-sm scrollbar">
            <div class="text-slate-500">[等待启动...]</div>
          </div>
        </div>
      </div>

      <!-- 部署页面 -->
      <div id="page-deploy" class="page p-6 hidden">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="cloud-upload" class="w-6 h-6 text-indigo-400"></i> 项目部署</h2>
            <p class="text-slate-400 mt-1">将项目部署到云平台或自定义服务器</p>
          </div>
          <div id="deploy-status" class="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800">
            <span class="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>就绪</span>
          </div>
        </div>
        
        <!-- 平台选择 -->
        <div class="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4 text-cyan-400"></i> 选择部署平台</h3>
          <div class="grid grid-cols-5 gap-3" id="platform-grid">
            <button onclick="selectPlatform('netlify')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="netlify">
              <span class="text-2xl">🔷</span>
              <span class="text-sm font-medium">Netlify</span>
            </button>
            <button onclick="selectPlatform('vercel')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="vercel">
              <span class="text-2xl">▲</span>
              <span class="text-sm font-medium">Vercel</span>
            </button>
            <button onclick="selectPlatform('cloudflare')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="cloudflare">
              <span class="text-2xl">☁️</span>
              <span class="text-sm font-medium">Cloudflare</span>
            </button>
            <button onclick="selectPlatform('github-pages')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="github-pages">
              <span class="text-2xl">🐙</span>
              <span class="text-sm font-medium">GitHub Pages</span>
            </button>
            <button onclick="selectPlatform('surge')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="surge">
              <span class="text-2xl">⚡</span>
              <span class="text-sm font-medium">Surge</span>
            </button>
            <button onclick="selectPlatform('ftp')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="ftp">
              <span class="text-2xl">📂</span>
              <span class="text-sm font-medium">FTP</span>
            </button>
            <button onclick="selectPlatform('sftp')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="sftp">
              <span class="text-2xl">🔐</span>
              <span class="text-sm font-medium">SFTP</span>
            </button>
            <button onclick="selectPlatform('ssh')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="ssh">
              <span class="text-2xl">🖥️</span>
              <span class="text-sm font-medium">SSH/SCP</span>
            </button>
            <button onclick="selectPlatform('custom')" class="platform-btn flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border-2 border-transparent" data-platform="custom">
              <span class="text-2xl">⚙️</span>
              <span class="text-sm font-medium">自定义</span>
            </button>
          </div>
        </div>
        
        <!-- 部署配置 (动态显示) -->
        <div id="deploy-config" class="bg-slate-800 rounded-lg p-6 mb-6 hidden">
          <h3 class="font-semibold mb-4 flex items-center gap-2" id="config-title"><i data-lucide="settings" class="w-4 h-4 text-cyan-400"></i> 部署配置</h3>
          <div id="config-fields" class="grid grid-cols-2 gap-4">
            <!-- 配置字段将通过 JS 动态生成 -->
          </div>
          <div class="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="deploy-build" checked class="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-800">
              <span class="text-sm">部署前构建</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="deploy-open" class="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-800">
              <span class="text-sm">部署后打开浏览器</span>
            </label>
          </div>
        </div>
        
        <!-- 部署按钮 -->
        <div class="flex gap-3 mb-6">
          <button id="btn-deploy" onclick="startDeploy()" class="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            <i data-lucide="upload-cloud" class="w-4 h-4"></i> 开始部署
          </button>
          <button id="btn-cancel-deploy" onclick="cancelDeploy()" class="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors hidden">
            <i data-lucide="x" class="w-4 h-4"></i> 取消部署
          </button>
          <button onclick="showDeployHistory()" class="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <i data-lucide="history" class="w-4 h-4"></i> 部署历史
          </button>
        </div>
        
        <!-- 部署进度 -->
        <div id="deploy-progress" class="bg-slate-800 rounded-lg p-4 mb-6 hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> <span id="deploy-phase">部署中...</span></span>
            <span id="deploy-percent">0%</span>
          </div>
          <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div id="deploy-bar" class="h-full bg-indigo-500 transition-all duration-300" style="width: 0%"></div>
          </div>
          <div id="deploy-detail" class="text-sm text-slate-400 mt-2"></div>
        </div>
        
        <!-- 部署结果 -->
        <div id="deploy-result" class="bg-slate-800 rounded-lg p-6 mb-6 hidden">
          <div id="deploy-result-content"></div>
        </div>
        
        <!-- 部署日志 -->
        <div class="bg-slate-800 rounded-lg">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span class="font-medium flex items-center gap-2"><i data-lucide="terminal" class="w-4 h-4"></i> 部署日志</span>
            <button onclick="clearLog('deploy')" class="text-sm text-slate-400 hover:text-white flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3 h-3"></i> 清空
            </button>
          </div>
          <div id="deploy-console" class="h-64 overflow-y-auto p-4 font-mono text-sm scrollbar">
            <div class="text-slate-500">[等待部署...]</div>
          </div>
        </div>
        
        <!-- 部署历史弹窗 -->
        <div id="deploy-history-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
          <div class="bg-slate-800 rounded-lg w-[700px] max-h-[80vh] overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 class="font-semibold flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i> 部署历史</h3>
              <button onclick="hideDeployHistory()" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <div id="deploy-history-list" class="p-6 max-h-[60vh] overflow-y-auto scrollbar">
              <div class="text-slate-500 text-center">加载中...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 工具箱页面 -->
      <div id="page-tools" class="page p-6 hidden">
        <div class="mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="wrench" class="w-6 h-6 text-orange-400"></i> 工具箱</h2>
          <p class="text-slate-400 mt-1">常用开发工具和快捷操作</p>
        </div>
        
        <div class="grid grid-cols-2 gap-6">
          <!-- 端口检测 -->
          <div class="bg-slate-800 rounded-lg p-5">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="plug" class="w-4 h-4 text-cyan-400"></i> 端口检测</h3>
            <div class="flex gap-3 mb-4">
              <input type="number" id="check-port" value="3000" class="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">
              <button onclick="checkPort()" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors">检测</button>
            </div>
            <div id="port-result" class="text-sm text-slate-400">输入端口号检测是否被占用</div>
          </div>
          
          <!-- 缓存管理 -->
          <div class="bg-slate-800 rounded-lg p-5">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="trash" class="w-4 h-4 text-red-400"></i> 缓存管理</h3>
            <div class="space-y-3">
              <button onclick="clearViteCache()" class="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <i data-lucide="folder-x" class="w-4 h-4"></i> 清除 Vite 缓存 <span class="text-xs text-slate-500 ml-auto">node_modules/.vite</span>
              </button>
              <button onclick="clearBuildOutput()" class="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <i data-lucide="folder-minus" class="w-4 h-4"></i> 清除构建产物 <span class="text-xs text-slate-500 ml-auto">dist/</span>
              </button>
            </div>
          </div>
          
          <!-- 依赖信息 -->
          <div class="bg-slate-800 rounded-lg p-5">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="package" class="w-4 h-4 text-green-400"></i> 依赖信息</h3>
            <div class="space-y-3">
              <button onclick="loadDependencies()" class="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <i data-lucide="list" class="w-4 h-4"></i> 查看依赖列表
              </button>
              <button onclick="reinstallDeps()" class="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i> 重新安装依赖 <span class="text-xs text-slate-500 ml-auto">pnpm install</span>
              </button>
            </div>
            <div id="deps-list" class="mt-4 text-sm max-h-40 overflow-y-auto scrollbar hidden"></div>
          </div>
          
          <!-- 快速操作 -->
          <div class="bg-slate-800 rounded-lg p-5">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="zap" class="w-4 h-4 text-yellow-400"></i> 快速操作</h3>
            <div class="space-y-3">
              <button onclick="openInVSCode()" class="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <i data-lucide="code" class="w-4 h-4"></i> 在 VS Code 中打开
              </button>
              <button onclick="openInExplorer()" class="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <i data-lucide="folder" class="w-4 h-4"></i> 在文件管理器中打开
              </button>
              <button onclick="copyProjectPath()" class="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <i data-lucide="copy" class="w-4 h-4"></i> 复制项目路径
              </button>
            </div>
          </div>
        </div>
        
        <!-- 脚本运行器和系统监控 -->
        <div class="grid grid-cols-2 gap-6 mt-6">
          <!-- NPM 脚本 -->
          <div class="bg-slate-800 rounded-lg p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><i data-lucide="terminal" class="w-4 h-4 text-purple-400"></i> NPM 脚本</h3>
              <button onclick="loadScripts()" class="text-sm text-slate-400 hover:text-white"><i data-lucide="refresh-cw" class="w-3 h-3 inline"></i></button>
            </div>
            <div id="scripts-list" class="space-y-2 max-h-48 overflow-y-auto scrollbar">
              <div class="text-slate-500 text-sm">点击刷新加载脚本</div>
            </div>
          </div>
          
          <!-- 系统监控 -->
          <div class="bg-slate-800 rounded-lg p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><i data-lucide="activity" class="w-4 h-4 text-green-400"></i> 系统监控</h3>
              <button onclick="loadSystemResources()" class="text-sm text-slate-400 hover:text-white"><i data-lucide="refresh-cw" class="w-3 h-3 inline"></i></button>
            </div>
            <div id="system-monitor" class="space-y-3">
              <div class="text-slate-500 text-sm">点击刷新加载系统信息</div>
            </div>
          </div>
        </div>
        
        <!-- 工具日志 -->
        <div class="bg-slate-800 rounded-lg mt-6">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span class="font-medium flex items-center gap-2"><i data-lucide="terminal" class="w-4 h-4"></i> 操作日志</span>
            <button onclick="clearLog('tools')" class="text-sm text-slate-400 hover:text-white flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3 h-3"></i> 清空
            </button>
          </div>
          <div id="tools-console" class="h-48 overflow-y-auto p-4 font-mono text-sm scrollbar">
            <div class="text-slate-500">[等待操作...]</div>
          </div>
        </div>
      </div>

      <!-- 分析页面 -->
      <div id="page-analyze" class="page p-6 hidden">
        <div class="mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="pie-chart" class="w-6 h-6 text-pink-400"></i> 项目分析</h2>
          <p class="text-slate-400 mt-1">分析构建产物和项目依赖</p>
        </div>
        
        <div class="grid grid-cols-2 gap-6">
          <!-- Bundle 分析 -->
          <div class="bg-slate-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><i data-lucide="package" class="w-4 h-4 text-cyan-400"></i> Bundle 分析</h3>
              <button onclick="loadBundleAnalysis()" class="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-sm transition-colors">
                <i data-lucide="refresh-cw" class="w-3 h-3 inline mr-1"></i> 刷新
              </button>
            </div>
            <div id="bundle-stats" class="space-y-4">
              <div class="text-slate-500 text-center py-8">点击刷新加载分析数据</div>
            </div>
          </div>
          
          <!-- 依赖分析 -->
          <div class="bg-slate-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><i data-lucide="boxes" class="w-4 h-4 text-green-400"></i> 依赖分析</h3>
              <button onclick="loadDepsAnalysis()" class="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors">
                <i data-lucide="refresh-cw" class="w-3 h-3 inline mr-1"></i> 刷新
              </button>
            </div>
            <div id="deps-stats" class="space-y-4">
              <div class="text-slate-500 text-center py-8">点击刷新加载分析数据</div>
            </div>
          </div>
        </div>
        
        <!-- 文件类型分布图 -->
        <div class="bg-slate-800 rounded-lg p-6 mt-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="chart-pie" class="w-4 h-4 text-purple-400"></i> 文件类型分布</h3>
          <div class="grid grid-cols-2 gap-6">
            <canvas id="bundle-chart" width="400" height="250"></canvas>
            <div id="file-list" class="max-h-[250px] overflow-y-auto scrollbar">
              <div class="text-slate-500 text-center py-8">暂无数据</div>
            </div>
          </div>
        </div>
        
        <!-- 可更新依赖 -->
        <div class="bg-slate-800 rounded-lg p-6 mt-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="arrow-up-circle" class="w-4 h-4 text-yellow-400"></i> 可更新依赖</h3>
          <div id="outdated-deps" class="space-y-2">
            <div class="text-slate-500 text-center py-4">加载分析后显示可更新依赖</div>
          </div>
        </div>
      </div>

      <!-- Launcher 配置页面 - 支持多环境 -->
      <div id="page-launcher-config" class="page p-6 hidden">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="settings" class="w-6 h-6 text-slate-400"></i> Launcher 配置</h2>
            <p class="text-slate-400 mt-1">配置开发服务器和构建选项（支持多环境）</p>
          </div>
          <button onclick="saveLauncherConfig()" class="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors">
            <i data-lucide="save" class="w-4 h-4"></i> 保存配置
          </button>
        </div>
        
        <!-- 环境切换标签 -->
        <div class="flex gap-2 mb-6 bg-slate-800 p-1 rounded-lg w-fit">
          <button onclick="switchLauncherEnv('development')" id="lc-env-development" class="env-tab active px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
            <i data-lucide="code" class="w-4 h-4"></i> Development
          </button>
          <button onclick="switchLauncherEnv('staging')" id="lc-env-staging" class="env-tab px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
            <i data-lucide="flask-conical" class="w-4 h-4"></i> Staging
          </button>
          <button onclick="switchLauncherEnv('production')" id="lc-env-production" class="env-tab px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
            <i data-lucide="globe" class="w-4 h-4"></i> Production
          </button>
        </div>
        
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="server" class="w-4 h-4 text-cyan-400"></i> 服务器配置</h3>
            <div class="space-y-4">
              <div><label class="block text-sm text-slate-400 mb-1">默认端口</label><input type="number" id="lc-port" value="3000" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">主机地址</label><input type="text" id="lc-host" value="localhost" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">严格端口</label><select id="lc-strictPort" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="false">否 - 端口占用时自动切换</option><option value="true">是 - 端口占用时报错</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">自动打开浏览器</label><select id="lc-open" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="true">是</option><option value="false">否</option></select></div>
            </div>
          </div>
          
          <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="package" class="w-4 h-4 text-blue-400"></i> 构建配置</h3>
            <div class="space-y-4">
              <div><label class="block text-sm text-slate-400 mb-1">输出目录</label><input type="text" id="lc-outDir" value="dist" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">资源目录</label><input type="text" id="lc-assetsDir" value="assets" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">Source Map</label><select id="lc-sourcemap" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="false">关闭</option><option value="true">开启</option><option value="hidden">Hidden</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">代码压缩</label><select id="lc-minify" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="esbuild">ESBuild (快速)</option><option value="terser">Terser (更小)</option><option value="false">关闭</option></select></div>
            </div>
          </div>
          
          <div class="bg-slate-800 rounded-lg p-6 col-span-2">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold flex items-center gap-2"><i data-lucide="git-branch" class="w-4 h-4 text-green-400"></i> 代理配置</h3>
              <button onclick="addProxyRule()" class="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors">
                <i data-lucide="plus" class="w-3 h-3"></i> 添加代理规则
              </button>
            </div>
            <div id="proxy-rules" class="space-y-3">
              <!-- 默认代理规则 -->
              <div class="proxy-rule bg-slate-700 rounded-lg p-4" data-index="0">
                <div class="grid grid-cols-4 gap-3">
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">路径前缀</label>
                    <input type="text" class="proxy-path w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" value="/api" placeholder="/api">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">代理目标</label>
                    <input type="text" class="proxy-target w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" placeholder="http://localhost:8080">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">路径重写</label>
                    <select class="proxy-rewrite w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none">
                      <option value="true">移除前缀</option>
                      <option value="false">保留前缀</option>
                    </select>
                  </div>
                  <div class="flex items-end gap-2">
                    <div class="flex-1">
                      <label class="block text-xs text-slate-400 mb-1">WebSocket</label>
                      <select class="proxy-ws w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none">
                        <option value="true">开启</option>
                        <option value="false">关闭</option>
                      </select>
                    </div>
                    <button onclick="removeProxyRule(this)" class="px-2 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors" title="删除">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-xs text-slate-500 mt-3">提示: 可添加多个代理规则，如 /api → 后端服务, /upload → 文件服务</p>
          </div>
          
          <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="zap" class="w-4 h-4 text-yellow-400"></i> 高级配置</h3>
            <div class="space-y-4">
              <div><label class="block text-sm text-slate-400 mb-1">HTTPS</label><select id="lc-https" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="false">关闭</option><option value="true">开启</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">Base 路径</label><input type="text" id="lc-base" value="/" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">日志级别</label><select id="lc-logLevel" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="info">Info</option><option value="warn">Warn</option><option value="error">Error</option><option value="silent">Silent</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">清屏</label><select id="lc-clearScreen" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="true">是</option><option value="false">否</option></select></div>
            </div>
          </div>
        </div>
      </div>

      <!-- App 配置页面 - 支持多环境 -->
      <div id="page-app-config" class="page p-6 hidden">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="smartphone" class="w-6 h-6 text-slate-400"></i> App 配置</h2>
            <p class="text-slate-400 mt-1">配置应用程序运行时参数（支持多环境）</p>
          </div>
          <button onclick="saveAppConfig()" class="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors">
            <i data-lucide="save" class="w-4 h-4"></i> 保存配置
          </button>
        </div>
        
        <!-- 环境切换标签 -->
        <div class="flex gap-2 mb-6 bg-slate-800 p-1 rounded-lg w-fit">
          <button onclick="switchAppEnv('development')" id="ac-env-development" class="env-tab active px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
            <i data-lucide="code" class="w-4 h-4"></i> Development
          </button>
          <button onclick="switchAppEnv('staging')" id="ac-env-staging" class="env-tab px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
            <i data-lucide="flask-conical" class="w-4 h-4"></i> Staging
          </button>
          <button onclick="switchAppEnv('production')" id="ac-env-production" class="env-tab px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
            <i data-lucide="globe" class="w-4 h-4"></i> Production
          </button>
        </div>
        
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="info" class="w-4 h-4 text-cyan-400"></i> 基础配置</h3>
            <div class="space-y-4">
              <div><label class="block text-sm text-slate-400 mb-1">应用名称</label><input type="text" id="ac-name" value="${projectName}" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">应用标题</label><input type="text" id="ac-title" value="${projectName}" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">应用描述</label><textarea id="ac-description" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none" rows="2" placeholder="应用描述..."></textarea></div>
              <div><label class="block text-sm text-slate-400 mb-1">版本号</label><input type="text" id="ac-version" value="1.0.0" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
            </div>
          </div>
          
          <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="link" class="w-4 h-4 text-blue-400"></i> API 配置</h3>
            <div class="space-y-4">
              <div><label class="block text-sm text-slate-400 mb-1">API 基础地址</label><input type="text" id="ac-apiBase" placeholder="https://api.example.com" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">WebSocket 地址</label><input type="text" id="ac-wsUrl" placeholder="wss://ws.example.com" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">请求超时 (ms)</label><input type="number" id="ac-timeout" value="30000" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">开启 Mock</label><select id="ac-mock" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="false">关闭</option><option value="true">开启</option></select></div>
            </div>
          </div>
          
          <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="palette" class="w-4 h-4 text-purple-400"></i> 主题配置</h3>
            <div class="space-y-4">
              <div><label class="block text-sm text-slate-400 mb-1">主题色</label><div class="flex gap-2"><input type="color" id="ac-primaryColor" value="#06b6d4" class="w-12 h-10 bg-slate-700 border border-slate-600 rounded cursor-pointer"><input type="text" id="ac-primaryColorText" value="#06b6d4" class="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div></div>
              <div><label class="block text-sm text-slate-400 mb-1">暗色模式</label><select id="ac-darkMode" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="auto">跟随系统</option><option value="light">亮色</option><option value="dark">暗色</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">布局模式</label><select id="ac-layout" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="side">侧边栏布局</option><option value="top">顶部导航布局</option><option value="mix">混合布局</option></select></div>
            </div>
          </div>
          
          <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="toggle-left" class="w-4 h-4 text-green-400"></i> 功能开关</h3>
            <div class="space-y-4">
              <div><label class="block text-sm text-slate-400 mb-1">调试模式</label><select id="ac-debug" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="false">关闭</option><option value="true">开启</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">性能监控</label><select id="ac-performance" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="false">关闭</option><option value="true">开启</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">错误上报</label><select id="ac-errorReport" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="false">关闭</option><option value="true">开启</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">水印</label><select id="ac-watermark" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="false">关闭</option><option value="true">开启</option></select></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    let ws = null;
    let currentPage = 'dev';
    let currentLauncherEnv = 'development';
    let currentAppEnv = 'development';
    
    // 环境配置存储
    const launcherConfigs = {
      development: { port: 3000, host: 'localhost', proxyTarget: 'http://localhost:8080' },
      staging: { port: 3000, host: 'localhost', proxyTarget: 'https://staging-api.example.com' },
      production: { port: 3000, host: 'localhost', proxyTarget: 'https://api.example.com' }
    };
    const appConfigs = {
      development: { apiBase: 'http://localhost:8080', debug: true, mock: true },
      staging: { apiBase: 'https://staging-api.example.com', debug: true, mock: false },
      production: { apiBase: 'https://api.example.com', debug: false, mock: false }
    };
    
    // 主题色配置
    const themeColors = {
      cyan: { 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490' },
      blue: { 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
      violet: { 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
      rose: { 500: '#f43f5e', 600: '#e11d48', 700: '#be123c' },
      emerald: { 500: '#10b981', 600: '#059669', 700: '#047857' },
      amber: { 500: '#f59e0b', 600: '#d97706', 700: '#b45309' }
    };
    let currentTheme = localStorage.getItem('launcher-theme') || 'dark';
    let currentColor = localStorage.getItem('launcher-color') || 'cyan';

    // 初始化 Lucide 图标
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      connectWS();
      detectFramework();
      // 初始化主题
      initTheme();
    });
    
    function initTheme() {
      // 应用保存的主题
      if (currentTheme === 'light') {
        // 直接调用toggleTheme将dark切换为light
        toggleTheme();
      }
      // 应用保存的主题色
      setThemeColor(currentColor, false);
      // 更新选中的颜色按钮
      document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(currentColor)) {
          btn.classList.add('active');
        }
      });
      lucide.createIcons();
    }
    
    function toggleTheme() {
      const body = document.body;
      const isDark = body.classList.contains('dark');
      
      if (isDark) {
        // 切换到亮色
        body.classList.remove('dark', 'bg-slate-900', 'text-white');
        body.classList.add('light', 'bg-gray-50', 'text-slate-800');
        document.getElementById('theme-icon').setAttribute('data-lucide', 'sun');
        document.getElementById('theme-text').textContent = '亮色';
        currentTheme = 'light';
        
        // 更新侧边栏
        document.getElementById('sidebar').className = 'sidebar fixed h-full bg-white border-r border-slate-200 flex flex-col z-50';
        
        // 更新所有卡片/面板背景
        document.querySelectorAll('.bg-slate-800').forEach(el => {
          el.classList.remove('bg-slate-800');
          el.classList.add('bg-white', 'shadow-sm', 'border', 'border-slate-200');
        });
        document.querySelectorAll('.bg-slate-700').forEach(el => {
          el.classList.remove('bg-slate-700');
          el.classList.add('bg-slate-100');
        });
        document.querySelectorAll('.bg-slate-600').forEach(el => {
          el.classList.remove('bg-slate-600');
          el.classList.add('bg-slate-200');
        });
        document.querySelectorAll('.border-slate-700').forEach(el => {
          el.classList.remove('border-slate-700');
          el.classList.add('border-slate-200');
        });
        document.querySelectorAll('.border-slate-600').forEach(el => {
          el.classList.remove('border-slate-600');
          el.classList.add('border-slate-300');
        });
        document.querySelectorAll('.text-slate-400').forEach(el => {
          el.classList.remove('text-slate-400');
          el.classList.add('text-slate-500');
        });
        document.querySelectorAll('.text-slate-500').forEach(el => {
          if (!el.classList.contains('text-slate-500')) {
            el.classList.remove('text-slate-500');
            el.classList.add('text-slate-600');
          }
        });
      } else {
        // 切换到暗色
        body.classList.remove('light', 'bg-gray-50', 'text-slate-800');
        body.classList.add('dark', 'bg-slate-900', 'text-white');
        document.getElementById('theme-icon').setAttribute('data-lucide', 'moon');
        document.getElementById('theme-text').textContent = '暗色';
        currentTheme = 'dark';
        
        // 更新侧边栏
        document.getElementById('sidebar').className = 'sidebar fixed h-full bg-slate-800 border-r border-slate-700 flex flex-col z-50';
        
        // 还原所有卡片/面板背景
        document.querySelectorAll('.bg-white.shadow-sm').forEach(el => {
          el.classList.remove('bg-white', 'shadow-sm', 'border', 'border-slate-200');
          el.classList.add('bg-slate-800');
        });
        document.querySelectorAll('.bg-slate-100').forEach(el => {
          el.classList.remove('bg-slate-100');
          el.classList.add('bg-slate-700');
        });
        document.querySelectorAll('.bg-slate-200').forEach(el => {
          el.classList.remove('bg-slate-200');
          el.classList.add('bg-slate-600');
        });
        document.querySelectorAll('.border-slate-200').forEach(el => {
          el.classList.remove('border-slate-200');
          el.classList.add('border-slate-700');
        });
        document.querySelectorAll('.border-slate-300').forEach(el => {
          el.classList.remove('border-slate-300');
          el.classList.add('border-slate-600');
        });
      }
      localStorage.setItem('launcher-theme', currentTheme);
      lucide.createIcons();
    }
    
    function setThemeColor(color, save = true) {
      const colors = themeColors[color];
      if (!colors) return;
      
      document.documentElement.style.setProperty('--primary-500', colors[500]);
      document.documentElement.style.setProperty('--primary-600', colors[600]);
      document.documentElement.style.setProperty('--primary-700', colors[700]);
      
      // 更新选中状态
      document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('active'));
      event?.target?.classList?.add('active');
      
      currentColor = color;
      if (save) {
        localStorage.setItem('launcher-color', color);
      }
    }

    function switchPage(page) {
      document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
      document.getElementById('page-' + page).classList.remove('hidden');
      document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById('menu-' + page);
      if (btn) btn.classList.add('active');
      currentPage = page;
      lucide.createIcons();
      // 切换到配置页面时加载配置
      if (page === 'launcher-config') {
        loadLauncherConfigFromAPI();
      }
    }

    function switchLauncherEnv(env) {
      currentLauncherEnv = env;
      document.querySelectorAll('[id^="lc-env-"]').forEach(b => b.classList.remove('active'));
      document.getElementById('lc-env-' + env).classList.add('active');
      loadLauncherConfig(env);
    }

    function switchAppEnv(env) {
      currentAppEnv = env;
      document.querySelectorAll('[id^="ac-env-"]').forEach(b => b.classList.remove('active'));
      document.getElementById('ac-env-' + env).classList.add('active');
      loadAppConfig(env);
    }

    function loadLauncherConfig(env) {
      const config = launcherConfigs[env] || {};
      if (config.port) document.getElementById('lc-port').value = config.port;
      if (config.proxyTarget) document.getElementById('lc-proxyTarget').value = config.proxyTarget;
    }

    function loadAppConfig(env) {
      const config = appConfigs[env] || {};
      if (config.apiBase) document.getElementById('ac-apiBase').value = config.apiBase;
      if (config.debug !== undefined) document.getElementById('ac-debug').value = config.debug.toString();
      if (config.mock !== undefined) document.getElementById('ac-mock').value = config.mock.toString();
    }

    function connectWS() {
      ws = new WebSocket('ws://' + location.host + '/ws');
      ws.onopen = () => {
        document.getElementById('ws-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400"></span><span class="text-green-400">已连接</span>';
        log('dev', 'info', '已连接到 Dashboard');
      };
      ws.onclose = () => {
        document.getElementById('ws-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-red-400"></span><span class="text-red-400">已断开</span>';
        setTimeout(connectWS, 3000);
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'log') {
            log(currentPage, data.payload.level, data.payload.message);
            // 检测开发服务器启动成功 - 支持中英文
            const msg = data.payload.message;
            // 检测 Local/本地/localhost 地址，或者任何包含 http://...:\d+ 的行
            if ((msg.includes('Local:') || msg.includes('本地') || msg.includes('localhost') || msg.includes('http://')) && msg.match(/http.*:(\d+)/)) {
              const portMatch = msg.match(/:(\d+)/);
              if (portMatch) {
                const port = parseInt(portMatch[1], 10);
                if (port > 0 && port < 65536 && devServerPort !== port) {
                  devServerPort = port;
                  document.getElementById('dev-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span><span class="text-green-400">运行中 :' + devServerPort + '</span>';
                  showToast('🚀 开发服务器已启动 → localhost:' + devServerPort, 'success', 4000);
                }
              }
            }
            // 检测预览服务器启动成功
            if ((msg.includes('preview') || msg.includes('Preview')) && msg.includes('http')) {
              const portMatch = msg.match(/:(\d+)/);
              if (portMatch) {
                const port = parseInt(portMatch[1], 10);
                if (previewServerPort !== port) {
                  previewServerPort = port;
                  document.getElementById('preview-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span><span class="text-purple-400">运行中 :' + previewServerPort + '</span>';
                  showToast('👀 预览服务器已启动 → localhost:' + previewServerPort, 'success', 4000);
                }
              }
            }
            // 检测构建完成
            if (msg.includes('built in') || msg.includes('构建完成')) {
              showToast('✅ 构建完成！', 'success');
            }
          } else if (data.type === 'build') {
            // 处理构建进度
            const { phase, progress } = data.payload;
            document.getElementById('build-percent').textContent = progress + '%';
            document.getElementById('build-bar').style.width = progress + '%';
            if (phase === 'done') {
              document.getElementById('build-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400"></span><span class="text-green-400">完成</span>';
            } else if (phase === 'error') {
              document.getElementById('build-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-red-400"></span><span class="text-red-400">失败</span>';
            }
          } else if (data.type === 'deployProgress' || data.type === 'deployStatus' || data.type === 'deployResult') {
            // 处理部署相关消息
            handleDeployWSMessage(data);
          }
        } catch(err) {}
      };
    }

    function log(page, level, msg) {
      const el = document.getElementById(page + '-console');
      if (!el) return;
      const colors = { info: 'text-cyan-400', warn: 'text-yellow-400', error: 'text-red-400', success: 'text-green-400', debug: 'text-slate-500' };
      const icons = { info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅', debug: '🔍' };
      const time = new Date().toLocaleTimeString();
      el.innerHTML += '<div class="py-0.5 flex items-start gap-2 ' + (colors[level] || 'text-slate-300') + '"><span class="text-slate-500 shrink-0">[' + time + ']</span><span>' + (icons[level] || '') + ' ' + msg + '</span></div>';
      el.scrollTop = el.scrollHeight;
    }
    
    function showToast(message, type = 'info', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      const colors = {
        info: 'bg-blue-500',
        success: 'bg-green-500', 
        warn: 'bg-yellow-500',
        error: 'bg-red-500'
      };
      const icons = {
        info: 'info',
        success: 'check-circle',
        warn: 'alert-triangle',
        error: 'x-circle'
      };
      
      toast.className = 'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transform translate-x-full transition-transform duration-300 ' + (colors[type] || colors.info);
      toast.innerHTML = '<i data-lucide="' + (icons[type] || icons.info) + '" class="w-5 h-5"></i><span>' + message + '</span>';
      
      container.appendChild(toast);
      lucide.createIcons();
      
      // 动画进入
      requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full');
      });
      
      // 自动消失
      setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    function clearLog(page) {
      const el = document.getElementById(page + '-console');
      if (el) el.innerHTML = '<div class="text-slate-500">[已清空]</div>';
    }

    let devServerPort = null;
    let previewServerPort = null;

    async function startDev() {
      log('dev', 'info', '启动开发服务器...');
      document.getElementById('btn-start-dev').classList.add('hidden');
      document.getElementById('btn-stop-dev').classList.remove('hidden');
      document.getElementById('dev-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span><span class="text-yellow-400">启动中...</span>';
      lucide.createIcons();
      const port = document.getElementById('dev-port').value;
      const host = document.getElementById('dev-host').value;
      try {
        const res = await fetch('/api/action/dev', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ port: parseInt(port), host }) });
        const data = await res.json();
        if (data.success) {
          // 端口可能从API返回，也可能从WebSocket日志中检测
          if (data.data?.port) {
            devServerPort = data.data.port;
            document.getElementById('dev-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span><span class="text-green-400">运行中 :' + devServerPort + '</span>';
            log('dev', 'success', '✅ 服务器启动成功，等待服务就绪...');
          }
        } else {
          throw new Error(data.error || '启动失败');
        }
      } catch (e) { 
        log('dev', 'error', '启动失败: ' + e.message);
        document.getElementById('btn-start-dev').classList.remove('hidden');
        document.getElementById('btn-stop-dev').classList.add('hidden');
        document.getElementById('dev-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-red-400"></span><span class="text-red-400">启动失败</span>';
      }
    }

    function stopDev() {
      log('dev', 'info', '停止服务器...');
      document.getElementById('btn-start-dev').classList.remove('hidden');
      document.getElementById('btn-stop-dev').classList.add('hidden');
      document.getElementById('dev-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>未运行</span>';
      devServerPort = null;
      fetch('/api/action/stop', { method: 'POST' });
    }

    function openInBrowser() {
      if (!devServerPort) {
        showToast('请先启动服务器', 'warn');
        log('dev', 'warn', '服务器未启动，无法打开浏览器');
        return;
      }
      const https = document.getElementById('dev-https').value === 'true';
      const url = (https ? 'https' : 'http') + '://localhost:' + devServerPort;
      window.open(url, '_blank');
      showToast('已在新标签页打开 ' + url, 'success');
      log('dev', 'info', '在浏览器中打开: ' + url);
    }
    
    function openPreviewInBrowser() {
      if (!previewServerPort) {
        showToast('请先启动预览服务器', 'warn');
        log('preview', 'warn', '预览服务器未启动');
        return;
      }
      const url = 'http://localhost:' + previewServerPort;
      window.open(url, '_blank');
      showToast('已打开预览页面', 'success');
    }

    async function startBuild() {
      log('build', 'info', '开始构建...');
      document.getElementById('build-progress').classList.remove('hidden');
      document.getElementById('build-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span><span class="text-blue-400">构建中</span>';
      document.getElementById('build-percent').textContent = '0%';
      document.getElementById('build-bar').style.width = '0%';
      lucide.createIcons();
      try {
        await fetch('/api/action/build', { method: 'POST' });
      } catch (e) { 
        log('build', 'error', '构建失败: ' + e.message);
        document.getElementById('build-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-red-400"></span><span class="text-red-400">失败</span>';
      }
    }

    function openDistFolder() { log('build', 'info', '打开输出目录: dist/'); }

    async function startPreview() {
      log('preview', 'info', '启动预览服务器...');
      document.getElementById('btn-start-preview').classList.add('hidden');
      document.getElementById('btn-stop-preview').classList.remove('hidden');
      document.getElementById('preview-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span><span class="text-yellow-400">启动中...</span>';
      lucide.createIcons();
      const port = document.getElementById('preview-port').value;
      try {
        const res = await fetch('/api/action/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ port }) });
        const data = await res.json();
        if (data.success) {
          previewServerPort = data.data?.port || port;
        }
      } catch (e) { 
        log('preview', 'error', '启动失败: ' + e.message);
        document.getElementById('btn-start-preview').classList.remove('hidden');
        document.getElementById('btn-stop-preview').classList.add('hidden');
        document.getElementById('preview-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-red-400"></span><span class="text-red-400">启动失败</span>';
      }
    }

    function stopPreview() {
      log('preview', 'info', '停止预览服务器...');
      document.getElementById('btn-start-preview').classList.remove('hidden');
      document.getElementById('btn-stop-preview').classList.add('hidden');
      document.getElementById('preview-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>未运行</span>';
      previewServerPort = null;
      fetch('/api/action/stop', { method: 'POST' });
    }

    let proxyRuleIndex = 1;
    
    // 从API加载 Launcher 配置
    async function loadLauncherConfigFromAPI() {
      try {
        const res = await fetch('/api/config/launcher/current');
        const data = await res.json();
        if (data.success && data.data) {
          const config = data.data;
          // 填充服务器配置
          if (config.server) {
            document.getElementById('lc-port').value = config.server.port || 3000;
            document.getElementById('lc-host').value = config.server.host || 'localhost';
            document.getElementById('lc-strictPort').value = config.server.strictPort ? 'true' : 'false';
            document.getElementById('lc-open').value = config.server.open !== false ? 'true' : 'false';
            document.getElementById('lc-https').value = config.server.https ? 'true' : 'false';
          }
          // 填充构建配置
          if (config.build) {
            document.getElementById('lc-outDir').value = config.build.outDir || 'dist';
            document.getElementById('lc-assetsDir').value = config.build.assetsDir || 'assets';
            document.getElementById('lc-sourcemap').value = config.build.sourcemap === true ? 'true' : (config.build.sourcemap || 'false');
            document.getElementById('lc-minify').value = config.build.minify === false ? 'false' : (config.build.minify || 'esbuild');
          }
          document.getElementById('lc-base').value = config.base || '/';
          document.getElementById('lc-logLevel').value = config.logLevel || 'info';
          document.getElementById('lc-clearScreen').value = config.clearScreen !== false ? 'true' : 'false';
          
          // 加载代理规则
          if (config.server?.proxy && Object.keys(config.server.proxy).length > 0) {
            loadProxyRules(config.server.proxy);
          }
          log('dev', 'info', '已加载 Launcher 配置');
        }
      } catch (e) {
        console.error('加载配置失败:', e);
      }
    }
    
    // 从配置对象加载代理规则
    function loadProxyRules(proxyConfig) {
      const container = document.getElementById('proxy-rules');
      container.innerHTML = '';
      proxyRuleIndex = 0;
      
      const entries = Object.entries(proxyConfig);
      if (entries.length === 0) {
        // 添加默认空规则
        addProxyRule();
        return;
      }
      
      entries.forEach(([path, config]) => {
        const target = typeof config === 'string' ? config : config.target;
        const rewrite = typeof config === 'object' && config.rewrite;
        const ws = typeof config === 'object' && config.ws;
        
        const rule = document.createElement('div');
        rule.className = 'proxy-rule bg-slate-700 rounded-lg p-4';
        rule.dataset.index = proxyRuleIndex++;
        rule.innerHTML = \`
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">路径前缀</label>
              <input type="text" class="proxy-path w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" value="\${path}" placeholder="/api">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">代理目标</label>
              <input type="text" class="proxy-target w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" value="\${target || ''}" placeholder="http://localhost:8080">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">路径重写</label>
              <select class="proxy-rewrite w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none">
                <option value="true" \${rewrite ? 'selected' : ''}>移除前缀</option>
                <option value="false" \${!rewrite ? 'selected' : ''}>保留前缀</option>
              </select>
            </div>
            <div class="flex items-end gap-2">
              <div class="flex-1">
                <label class="block text-xs text-slate-400 mb-1">WebSocket</label>
                <select class="proxy-ws w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none">
                  <option value="true" \${ws ? 'selected' : ''}>开启</option>
                  <option value="false" \${!ws ? 'selected' : ''}>关闭</option>
                </select>
              </div>
              <button onclick="removeProxyRule(this)" class="px-2 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors" title="删除">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        \`;
        container.appendChild(rule);
      });
      lucide.createIcons();
    }
    
    function addProxyRule() {
      const container = document.getElementById('proxy-rules');
      const newRule = document.createElement('div');
      newRule.className = 'proxy-rule bg-slate-700 rounded-lg p-4';
      newRule.dataset.index = proxyRuleIndex++;
      newRule.innerHTML = \`
        <div class="grid grid-cols-4 gap-3">
          <div>
            <label class="block text-xs text-slate-400 mb-1">路径前缀</label>
            <input type="text" class="proxy-path w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" placeholder="/upload">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">代理目标</label>
            <input type="text" class="proxy-target w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" placeholder="http://localhost:9000">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">路径重写</label>
            <select class="proxy-rewrite w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none">
              <option value="true">移除前缀</option>
              <option value="false">保留前缀</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <label class="block text-xs text-slate-400 mb-1">WebSocket</label>
              <select class="proxy-ws w-full bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none">
                <option value="false">关闭</option>
                <option value="true">开启</option>
              </select>
            </div>
            <button onclick="removeProxyRule(this)" class="px-2 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors" title="删除">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      \`;
      container.appendChild(newRule);
      lucide.createIcons();
      log('dev', 'info', '已添加新的代理规则');
    }
    
    function removeProxyRule(btn) {
      const rule = btn.closest('.proxy-rule');
      const rules = document.querySelectorAll('.proxy-rule');
      if (rules.length <= 1) {
        log('dev', 'warn', '至少需要保留一条代理规则');
        return;
      }
      rule.remove();
      log('dev', 'info', '已删除代理规则');
    }
    
    function getProxyRules() {
      const rules = [];
      document.querySelectorAll('.proxy-rule').forEach(rule => {
        const path = rule.querySelector('.proxy-path').value;
        const target = rule.querySelector('.proxy-target').value;
        if (path && target) {
          rules.push({
            path,
            target,
            rewrite: rule.querySelector('.proxy-rewrite').value === 'true',
            ws: rule.querySelector('.proxy-ws').value === 'true'
          });
        }
      });
      return rules;
    }

    async function saveLauncherConfig() {
      const config = {
        env: currentLauncherEnv,
        server: {
          port: parseInt(document.getElementById('lc-port').value) || 3000,
          host: document.getElementById('lc-host').value || 'localhost',
          strictPort: document.getElementById('lc-strictPort').value === 'true',
          open: document.getElementById('lc-open').value === 'true',
          https: document.getElementById('lc-https').value === 'true',
        },
        build: {
          outDir: document.getElementById('lc-outDir').value || 'dist',
          assetsDir: document.getElementById('lc-assetsDir').value || 'assets',
          sourcemap: document.getElementById('lc-sourcemap').value,
          minify: document.getElementById('lc-minify').value === 'false' ? false : document.getElementById('lc-minify').value,
        },
        base: document.getElementById('lc-base').value || '/',
        logLevel: document.getElementById('lc-logLevel').value || 'info',
        clearScreen: document.getElementById('lc-clearScreen').value === 'true',
        proxyRules: getProxyRules()
      };
      launcherConfigs[currentLauncherEnv] = config;
      
      try {
        const res = await fetch('/api/config/launcher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        const data = await res.json();
        if (data.success) {
          showToast('配置已保存到 launcher.config.ts', 'success');
          log('dev', 'success', 'Launcher 配置已保存 (' + currentLauncherEnv + ')，包含 ' + config.proxyRules.length + ' 条代理规则');
        } else {
          showToast('保存失败: ' + (data.message || '未知错误'), 'error');
          log('dev', 'error', '保存失败: ' + (data.message || '未知错误'));
        }
      } catch (e) {
        showToast('保存失败: ' + e.message, 'error');
        log('dev', 'error', '保存失败: ' + e.message);
      }
    }

    async function saveAppConfig() {
      const config = {
        env: currentAppEnv,
        name: document.getElementById('ac-name')?.value || '',
        title: document.getElementById('ac-title')?.value || '',
        apiBase: document.getElementById('ac-apiBase')?.value || '',
        debug: document.getElementById('ac-debug')?.value === 'true',
        mock: document.getElementById('ac-mock')?.value === 'true'
      };
      appConfigs[currentAppEnv] = config;
      showToast('App 配置已保存 (' + currentAppEnv + ')', 'success');
      log('dev', 'success', 'App 配置已保存 (' + currentAppEnv + ')');
    }

    async function detectFramework() {
      try {
        const res = await fetch('/api/project/detect');
        const data = await res.json();
        if (data.success && data.data) {
          document.getElementById('framework-name').textContent = data.data.framework;
          log('dev', 'info', '检测到框架: ' + data.data.framework);
        }
      } catch (e) {}
    }

    // 主题色同步
    document.getElementById('ac-primaryColor')?.addEventListener('input', (e) => {
      document.getElementById('ac-primaryColorText').value = e.target.value;
    });
    document.getElementById('ac-primaryColorText')?.addEventListener('input', (e) => {
      document.getElementById('ac-primaryColor').value = e.target.value;
    });

    // ========== 工具箱功能 ==========
    async function checkPort() {
      const port = document.getElementById('check-port').value;
      log('tools', 'info', '检测端口: ' + port);
      try {
        const res = await fetch('/api/tools/check-port?port=' + port);
        const data = await res.json();
        const resultEl = document.getElementById('port-result');
        if (data.success) {
          if (data.data.inUse) {
            resultEl.innerHTML = '<span class="text-red-400">⚠️ 端口 ' + port + ' 已被占用</span>';
            log('tools', 'warn', '端口 ' + port + ' 已被占用');
          } else {
            resultEl.innerHTML = '<span class="text-green-400">✓ 端口 ' + port + ' 可用</span>';
            log('tools', 'success', '端口 ' + port + ' 可用');
          }
        }
      } catch (e) {
        log('tools', 'error', '检测失败: ' + e.message);
      }
    }

    async function clearViteCache() {
      log('tools', 'info', '清除 Vite 缓存...');
      try {
        const res = await fetch('/api/tools/clear-cache', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'vite' }) });
        const data = await res.json();
        if (data.success) {
          log('tools', 'success', 'Vite 缓存已清除');
        } else {
          log('tools', 'warn', data.message || '缓存目录不存在');
        }
      } catch (e) {
        log('tools', 'error', '清除失败: ' + e.message);
      }
    }

    async function clearBuildOutput() {
      log('tools', 'info', '清除构建产物...');
      try {
        const res = await fetch('/api/tools/clear-cache', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'dist' }) });
        const data = await res.json();
        if (data.success) {
          log('tools', 'success', '构建产物已清除');
        } else {
          log('tools', 'warn', data.message || 'dist目录不存在');
        }
      } catch (e) {
        log('tools', 'error', '清除失败: ' + e.message);
      }
    }

    async function loadDependencies() {
      log('tools', 'info', '加载依赖列表...');
      try {
        const res = await fetch('/api/tools/dependencies');
        const data = await res.json();
        if (data.success && data.data) {
          const deps = data.data;
          const listEl = document.getElementById('deps-list');
          let html = '<div class="space-y-2">';
          if (deps.dependencies && Object.keys(deps.dependencies).length > 0) {
            html += '<div class="text-slate-400 text-xs mb-1">Dependencies:</div>';
            for (const [name, version] of Object.entries(deps.dependencies)) {
              html += '<div class="flex justify-between"><span class="text-cyan-400">' + name + '</span><span class="text-slate-500">' + version + '</span></div>';
            }
          }
          if (deps.devDependencies && Object.keys(deps.devDependencies).length > 0) {
            html += '<div class="text-slate-400 text-xs mb-1 mt-3">DevDependencies:</div>';
            for (const [name, version] of Object.entries(deps.devDependencies)) {
              html += '<div class="flex justify-between"><span class="text-green-400">' + name + '</span><span class="text-slate-500">' + version + '</span></div>';
            }
          }
          html += '</div>';
          listEl.innerHTML = html;
          listEl.classList.remove('hidden');
          log('tools', 'success', '已加载 ' + (Object.keys(deps.dependencies || {}).length + Object.keys(deps.devDependencies || {}).length) + ' 个依赖');
        }
      } catch (e) {
        log('tools', 'error', '加载失败: ' + e.message);
      }
    }

    async function reinstallDeps() {
      log('tools', 'info', '重新安装依赖 (pnpm install)...');
      try {
        const res = await fetch('/api/tools/reinstall', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          log('tools', 'success', '依赖安装已启动，请查看控制台输出');
        } else {
          log('tools', 'error', data.error || '安装失败');
        }
      } catch (e) {
        log('tools', 'error', '安装失败: ' + e.message);
      }
    }

    async function openInVSCode() {
      log('tools', 'info', '在 VS Code 中打开项目...');
      try {
        await fetch('/api/tools/open-editor', { method: 'POST' });
        log('tools', 'success', '已打开 VS Code');
      } catch (e) {
        log('tools', 'error', '打开失败: ' + e.message);
      }
    }

    async function openInExplorer() {
      log('tools', 'info', '在文件管理器中打开...');
      try {
        await fetch('/api/tools/open-folder', { method: 'POST' });
        log('tools', 'success', '已打开文件管理器');
      } catch (e) {
        log('tools', 'error', '打开失败: ' + e.message);
      }
    }

    function copyProjectPath() {
      const path = '${cwdPath}';
      navigator.clipboard.writeText(path).then(() => {
        log('tools', 'success', '已复制: ' + path);
      }).catch(() => {
        log('tools', 'error', '复制失败');
      });
    }

    // ========== 部署功能 ==========
    let selectedPlatform = null;
    let deployPlatforms = [];
    let isDeploying = false;
    
    // 加载平台信息
    async function loadDeployPlatforms() {
      try {
        const res = await fetch('/api/deploy/platforms');
        const data = await res.json();
        if (data.success) {
          deployPlatforms = data.data;
        }
      } catch (e) {
        console.error('加载平台信息失败:', e);
      }
    }
    
    // 选择部署平台
    function selectPlatform(platform) {
      selectedPlatform = platform;
      
      // 更新 UI
      document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.classList.remove('border-cyan-500');
        btn.classList.add('border-transparent');
      });
      const selectedBtn = document.querySelector('[data-platform="' + platform + '"]');
      if (selectedBtn) {
        selectedBtn.classList.remove('border-transparent');
        selectedBtn.classList.add('border-cyan-500');
      }
      
      // 显示配置表单
      showPlatformConfig(platform);
      
      // 启用部署按钮
      document.getElementById('btn-deploy').disabled = false;
      
      log('deploy', 'info', '已选择平台: ' + platform);
    }
    
    // 显示平台配置表单
    function showPlatformConfig(platform) {
      const platformInfo = deployPlatforms.find(p => p.id === platform);
      if (!platformInfo) return;
      
      document.getElementById('deploy-config').classList.remove('hidden');
      document.getElementById('config-title').innerHTML = '<i data-lucide="settings" class="w-4 h-4 text-cyan-400"></i> ' + platformInfo.name + ' 配置';
      
      const fieldsContainer = document.getElementById('config-fields');
      fieldsContainer.innerHTML = '';
      
      platformInfo.configFields.forEach(field => {
        const fieldHtml = \`
          <div>
            <label class="block text-sm text-slate-400 mb-1">\${field.label} \${field.required ? '<span class="text-red-400">*</span>' : ''}</label>
            \${field.type === 'boolean' 
              ? '<select id="deploy-' + field.name + '" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="true">是</option><option value="false"' + (field.default === false ? ' selected' : '') + '>否</option></select>'
              : field.type === 'select'
                ? '<select id="deploy-' + field.name + '" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none">' + (field.options || []).map(o => '<option value="' + o.value + '">' + o.label + '</option>').join('') + '</select>'
                : '<input type="' + (field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text') + '" id="deploy-' + field.name + '" placeholder="' + (field.placeholder || '') + '" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none" ' + (field.default ? 'value="' + field.default + '"' : '') + '>'
            }
            \${field.help ? '<p class="text-xs text-slate-500 mt-1">' + field.help + '</p>' : ''}
          </div>
        \`;
        fieldsContainer.innerHTML += fieldHtml;
      });
      
      lucide.createIcons();
    }
    
    // 收集部署配置
    function collectDeployConfig() {
      const platformInfo = deployPlatforms.find(p => p.id === selectedPlatform);
      if (!platformInfo) return null;
      
      const config = {};
      platformInfo.configFields.forEach(field => {
        const el = document.getElementById('deploy-' + field.name);
        if (el) {
          let value = el.value;
          if (field.type === 'boolean') value = value === 'true';
          else if (field.type === 'number') value = parseInt(value, 10) || field.default;
          config[field.name] = value;
        }
      });
      
      return config;
    }
    
    // 开始部署
    async function startDeploy() {
      if (!selectedPlatform || isDeploying) return;
      
      const config = collectDeployConfig();
      if (!config) return;
      
      // 验证必填字段
      const platformInfo = deployPlatforms.find(p => p.id === selectedPlatform);
      for (const field of platformInfo.configFields) {
        if (field.required && !config[field.name]) {
          showToast(field.label + ' 是必填项', 'error');
          return;
        }
      }
      
      isDeploying = true;
      document.getElementById('btn-deploy').classList.add('hidden');
      document.getElementById('btn-cancel-deploy').classList.remove('hidden');
      document.getElementById('deploy-progress').classList.remove('hidden');
      document.getElementById('deploy-result').classList.add('hidden');
      updateDeployStatus('deploying', '部署中...');
      
      log('deploy', 'info', '开始部署到 ' + selectedPlatform + '...');
      
      try {
        const res = await fetch('/api/deploy/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: selectedPlatform,
            config,
            buildBeforeDeploy: document.getElementById('deploy-build').checked,
            openAfterDeploy: document.getElementById('deploy-open').checked
          })
        });
        const data = await res.json();
        if (!data.success) {
          showDeployError(data.error || '部署启动失败');
        }
      } catch (e) {
        showDeployError(e.message);
      }
    }
    
    // 取消部署
    async function cancelDeploy() {
      try {
        await fetch('/api/deploy/cancel', { method: 'POST' });
        log('deploy', 'warn', '部署已取消');
        resetDeployUI();
      } catch (e) {
        log('deploy', 'error', '取消失败: ' + e.message);
      }
    }
    
    // 更新部署状态
    function updateDeployStatus(status, text) {
      const statusEl = document.getElementById('deploy-status');
      const dotColors = { idle: 'bg-slate-500', deploying: 'bg-yellow-400 animate-pulse', success: 'bg-green-400', error: 'bg-red-400' };
      statusEl.querySelector('span:first-child').className = 'w-2 h-2 rounded-full ' + (dotColors[status] || 'bg-slate-500');
      statusEl.querySelector('span:last-child').textContent = text || status;
    }
    
    // 更新部署进度
    function updateDeployProgress(progress) {
      document.getElementById('deploy-percent').textContent = progress.progress + '%';
      document.getElementById('deploy-bar').style.width = progress.progress + '%';
      document.getElementById('deploy-phase').textContent = progress.message || '部署中...';
      
      let detail = '';
      if (progress.filesUploaded !== undefined && progress.totalFiles) {
        detail += '文件: ' + progress.filesUploaded + '/' + progress.totalFiles + ' ';
      }
      if (progress.bytesUploaded !== undefined && progress.totalBytes) {
        detail += '大小: ' + formatSize(progress.bytesUploaded) + '/' + formatSize(progress.totalBytes);
      }
      document.getElementById('deploy-detail').textContent = detail;
    }
    
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + 'B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
      return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
    }
    
    // 显示部署结果
    function showDeployResult(result) {
      isDeploying = false;
      resetDeployUI();
      
      const resultEl = document.getElementById('deploy-result');
      const contentEl = document.getElementById('deploy-result-content');
      resultEl.classList.remove('hidden');
      
      if (result.success) {
        updateDeployStatus('success', '部署成功');
        contentEl.innerHTML = \`
          <div class="flex items-center gap-3 text-green-400 mb-4">
            <i data-lucide="check-circle" class="w-8 h-8"></i>
            <div>
              <div class="text-lg font-semibold">部署成功！</div>
              <div class="text-sm text-slate-400">\${result.duration ? '用时 ' + (result.duration / 1000).toFixed(1) + 's' : ''}</div>
            </div>
          </div>
          \${result.url ? '<div class="bg-slate-700 rounded-lg p-4"><div class="text-sm text-slate-400 mb-1">部署地址</div><a href="' + result.url + '" target="_blank" class="text-cyan-400 hover:underline break-all">' + result.url + '</a><button onclick="navigator.clipboard.writeText(\\'' + result.url + '\\');showToast(\\'已复制\\',\\'success\\')" class="ml-2 text-slate-400 hover:text-white"><i data-lucide="copy" class="w-4 h-4 inline"></i></button></div>' : ''}
        \`;
        showToast('部署成功！', 'success');
      } else {
        showDeployError(result.error || '部署失败');
      }
      lucide.createIcons();
    }
    
    // 显示部署错误
    function showDeployError(error) {
      isDeploying = false;
      resetDeployUI();
      updateDeployStatus('error', '部署失败');
      
      const resultEl = document.getElementById('deploy-result');
      const contentEl = document.getElementById('deploy-result-content');
      resultEl.classList.remove('hidden');
      
      contentEl.innerHTML = \`
        <div class="flex items-center gap-3 text-red-400 mb-4">
          <i data-lucide="x-circle" class="w-8 h-8"></i>
          <div>
            <div class="text-lg font-semibold">部署失败</div>
            <div class="text-sm text-slate-400">\${error}</div>
          </div>
        </div>
      \`;
      lucide.createIcons();
      showToast('部署失败: ' + error, 'error');
    }
    
    // 重置部署 UI
    function resetDeployUI() {
      document.getElementById('btn-deploy').classList.remove('hidden');
      document.getElementById('btn-cancel-deploy').classList.add('hidden');
      document.getElementById('deploy-progress').classList.add('hidden');
    }
    
    // 显示部署历史
    async function showDeployHistory() {
      document.getElementById('deploy-history-modal').classList.remove('hidden');
      const listEl = document.getElementById('deploy-history-list');
      listEl.innerHTML = '<div class="text-slate-500 text-center">加载中...</div>';
      
      try {
        const res = await fetch('/api/deploy/history');
        const data = await res.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
          listEl.innerHTML = '<div class="text-slate-500 text-center">暂无部署历史</div>';
          return;
        }
        
        let html = '<div class="space-y-3">';
        data.data.slice(0, 20).forEach(entry => {
          const statusIcon = entry.status === 'success' ? '✅' : entry.status === 'failed' ? '❌' : '⚠️';
          const date = new Date(entry.startTime).toLocaleString();
          html += \`
            <div class="bg-slate-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">\${statusIcon} \${entry.platform}</span>
                <span class="text-sm text-slate-400">\${date}</span>
              </div>
              \${entry.result?.url ? '<div class="text-sm text-cyan-400 truncate"><a href="' + entry.result.url + '" target="_blank">' + entry.result.url + '</a></div>' : ''}
              \${entry.result?.error ? '<div class="text-sm text-red-400">' + entry.result.error + '</div>' : ''}
            </div>
          \`;
        });
        html += '</div>';
        listEl.innerHTML = html;
      } catch (e) {
        listEl.innerHTML = '<div class="text-red-400 text-center">加载失败: ' + e.message + '</div>';
      }
    }
    
    // 隐藏部署历史
    function hideDeployHistory() {
      document.getElementById('deploy-history-modal').classList.add('hidden');
    }
    
    // 处理部署相关的 WebSocket 消息
    function handleDeployWSMessage(msg) {
      if (msg.type === 'deployProgress') {
        updateDeployProgress(msg.payload);
      } else if (msg.type === 'deployStatus') {
        updateDeployStatus(msg.payload.status);
      } else if (msg.type === 'deployResult') {
        showDeployResult(msg.payload);
      }
    }
    
    // 初始化时加载平台信息
    loadDeployPlatforms();

    // ========== 分析功能 ==========
    let bundleChart = null;
    
    async function loadBundleAnalysis() {
      const statsEl = document.getElementById('bundle-stats');
      statsEl.innerHTML = '<div class="text-slate-500 text-center py-8"><i data-lucide="loader" class="w-5 h-5 inline animate-spin"></i> 加载中...</div>';
      lucide.createIcons();
      
      try {
        const res = await fetch('/api/analyze/bundle');
        const data = await res.json();
        
        if (!data.success) {
          statsEl.innerHTML = '<div class="text-yellow-400 text-center py-8">' + (data.error || '加载失败') + '</div>';
          return;
        }
        
        const result = data.data;
        statsEl.innerHTML = \`
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-700 rounded p-3">
              <div class="text-xs text-slate-400">文件数量</div>
              <div class="text-xl font-bold text-cyan-400">\${result.files.length}</div>
            </div>
            <div class="bg-slate-700 rounded p-3">
              <div class="text-xs text-slate-400">原始大小</div>
              <div class="text-xl font-bold text-yellow-400">\${formatBytes(result.totalSize)}</div>
            </div>
            <div class="bg-slate-700 rounded p-3">
              <div class="text-xs text-slate-400">Gzip 大小</div>
              <div class="text-xl font-bold text-green-400">\${formatBytes(result.totalGzipSize)}</div>
            </div>
            <div class="bg-slate-700 rounded p-3">
              <div class="text-xs text-slate-400">压缩率</div>
              <div class="text-xl font-bold text-purple-400">\${((1 - result.totalGzipSize / result.totalSize) * 100).toFixed(1)}%</div>
            </div>
          </div>
        \`;
        
        // 更新图表
        updateBundleChart(result.byType);
        
        // 更新文件列表
        const fileListEl = document.getElementById('file-list');
        if (result.largestFiles && result.largestFiles.length > 0) {
          fileListEl.innerHTML = result.largestFiles.map(f => \`
            <div class="flex items-center justify-between text-sm py-1 border-b border-slate-700/50">
              <span class="text-slate-400 truncate flex-1" title="\${f.path}">\${f.path}</span>
              <span class="text-cyan-400 ml-2 whitespace-nowrap">\${formatBytes(f.size)}</span>
            </div>
          \`).join('');
        }
        
        lucide.createIcons();
      } catch (e) {
        statsEl.innerHTML = '<div class="text-red-400 text-center py-8">加载失败: ' + e.message + '</div>';
      }
    }
    
    function updateBundleChart(byType) {
      const ctx = document.getElementById('bundle-chart')?.getContext('2d');
      if (!ctx) return;
      
      if (bundleChart) {
        bundleChart.destroy();
      }
      
      const labels = Object.keys(byType).map(t => t.toUpperCase());
      const sizes = Object.values(byType).map(t => t.size);
      const colors = ['#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e', '#f43f5e', '#64748b'];
      
      bundleChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: sizes,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#94a3b8' } }
          }
        }
      });
    }
    
    async function loadDepsAnalysis() {
      const statsEl = document.getElementById('deps-stats');
      const outdatedEl = document.getElementById('outdated-deps');
      
      statsEl.innerHTML = '<div class="text-slate-500 text-center py-8"><i data-lucide="loader" class="w-5 h-5 inline animate-spin"></i> 加载中...</div>';
      lucide.createIcons();
      
      try {
        const res = await fetch('/api/analyze/deps');
        const data = await res.json();
        
        if (!data.success) {
          statsEl.innerHTML = '<div class="text-yellow-400 text-center py-8">' + (data.error || '加载失败') + '</div>';
          return;
        }
        
        const result = data.data;
        statsEl.innerHTML = \`
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-700 rounded p-3">
              <div class="text-xs text-slate-400">总依赖</div>
              <div class="text-xl font-bold text-cyan-400">\${result.total}</div>
            </div>
            <div class="bg-slate-700 rounded p-3">
              <div class="text-xs text-slate-400">已是最新</div>
              <div class="text-xl font-bold text-green-400">\${result.upToDate}</div>
            </div>
            <div class="bg-slate-700 rounded p-3">
              <div class="text-xs text-slate-400">可更新</div>
              <div class="text-xl font-bold text-yellow-400">\${result.needsUpdate}</div>
            </div>
            <div class="bg-slate-700 rounded p-3">
              <div class="text-xs text-slate-400">已废弃</div>
              <div class="text-xl font-bold text-red-400">\${result.deprecated?.length || 0}</div>
            </div>
          </div>
        \`;
        
        // 更新可更新依赖列表
        if (result.outdated && result.outdated.length > 0) {
          const majorDeps = result.outdated.filter(d => d.updateType === 'major');
          const minorDeps = result.outdated.filter(d => d.updateType === 'minor');
          const patchDeps = result.outdated.filter(d => d.updateType === 'patch');
          
          let html = '';
          
          if (majorDeps.length > 0) {
            html += '<div class="mb-3"><div class="text-red-400 text-xs mb-1">🔴 主版本更新</div>';
            majorDeps.forEach(d => {
              html += \`<div class="flex justify-between text-sm py-1"><span>\${d.name}</span><span class="text-slate-400">\${d.currentVersion} → <span class="text-red-400">\${d.latestVersion}</span></span></div>\`;
            });
            html += '</div>';
          }
          
          if (minorDeps.length > 0) {
            html += '<div class="mb-3"><div class="text-yellow-400 text-xs mb-1">🟡 次版本更新</div>';
            minorDeps.forEach(d => {
              html += \`<div class="flex justify-between text-sm py-1"><span>\${d.name}</span><span class="text-slate-400">\${d.currentVersion} → <span class="text-yellow-400">\${d.latestVersion}</span></span></div>\`;
            });
            html += '</div>';
          }
          
          if (patchDeps.length > 0) {
            html += '<div class="mb-3"><div class="text-green-400 text-xs mb-1">🟢 补丁更新</div>';
            patchDeps.slice(0, 5).forEach(d => {
              html += \`<div class="flex justify-between text-sm py-1"><span>\${d.name}</span><span class="text-slate-400">\${d.currentVersion} → <span class="text-green-400">\${d.latestVersion}</span></span></div>\`;
            });
            if (patchDeps.length > 5) {
              html += '<div class="text-slate-500 text-xs">还有 ' + (patchDeps.length - 5) + ' 个补丁更新...</div>';
            }
            html += '</div>';
          }
          
          outdatedEl.innerHTML = html || '<div class="text-green-400 text-center py-4">所有依赖都是最新的！</div>';
        } else {
          outdatedEl.innerHTML = '<div class="text-green-400 text-center py-4">✅ 所有依赖都是最新的！</div>';
        }
        
        lucide.createIcons();
      } catch (e) {
        statsEl.innerHTML = '<div class="text-red-400 text-center py-8">加载失败: ' + e.message + '</div>';
      }
    }
    
    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // ========== 脚本运行器 ==========
    async function loadScripts() {
      const el = document.getElementById('scripts-list');
      el.innerHTML = '<div class="text-slate-500 text-sm">加载中...</div>';
      
      try {
        const res = await fetch('/api/scripts');
        const data = await res.json();
        
        if (!data.success || !data.data.scripts.length) {
          el.innerHTML = '<div class="text-slate-500 text-sm">没有可用脚本</div>';
          return;
        }
        
        const categoryIcons = {
          dev: '🚀', build: '📦', test: '🧪', lint: '🔍', other: '📜'
        };
        
        el.innerHTML = data.data.scripts.map(s => \`
          <div class="flex items-center justify-between bg-slate-700 rounded px-3 py-2 text-sm">
            <div class="flex items-center gap-2">
              <span>\${categoryIcons[s.category] || '📜'}</span>
              <span class="font-medium">\${s.name}</span>
              <span class="text-slate-500 text-xs">\${s.description || ''}</span>
            </div>
            <button onclick="runNpmScript('\${s.name}')" class="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs">运行</button>
          </div>
        \`).join('');
        
        lucide.createIcons();
      } catch (e) {
        el.innerHTML = '<div class="text-red-400 text-sm">加载失败</div>';
      }
    }
    
    async function runNpmScript(name) {
      log('tools', 'info', '启动脚本: ' + name);
      try {
        const res = await fetch('/api/scripts/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) {
          showToast('脚本已启动: ' + name, 'success');
        } else {
          showToast('启动失败: ' + data.error, 'error');
        }
      } catch (e) {
        showToast('启动失败', 'error');
      }
    }

    // ========== 系统监控 ==========
    async function loadSystemResources() {
      const el = document.getElementById('system-monitor');
      
      try {
        const res = await fetch('/api/system/resources');
        const data = await res.json();
        
        if (!data.success) {
          el.innerHTML = '<div class="text-red-400 text-sm">加载失败</div>';
          return;
        }
        
        const r = data.data;
        el.innerHTML = \`
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>CPU 使用率</span>
                <span class="text-cyan-400">\${r.cpu.usage.toFixed(1)}%</span>
              </div>
              <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500 transition-all" style="width: \${Math.min(r.cpu.usage, 100)}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>内存使用率</span>
                <span class="text-green-400">\${r.memory.usagePercent.toFixed(1)}%</span>
              </div>
              <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-green-500 transition-all" style="width: \${r.memory.usagePercent}%"></div>
              </div>
              <div class="text-xs text-slate-500 mt-1">\${formatBytes(r.memory.used)} / \${formatBytes(r.memory.total)}</div>
            </div>
            <div>
              <div class="flex justify-between text-sm">
                <span>进程内存</span>
                <span class="text-yellow-400">\${formatBytes(r.process.memory)}</span>
              </div>
            </div>
          </div>
        \`;
      } catch (e) {
        el.innerHTML = '<div class="text-red-400 text-sm">加载失败</div>';
      }
    }
  </script>
</body>
</html>`
}
