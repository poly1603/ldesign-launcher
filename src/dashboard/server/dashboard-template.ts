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
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .sidebar { width: 260px; }
    .main-content { margin-left: 260px; }
    .scrollbar::-webkit-scrollbar { width: 6px; }
    .scrollbar::-webkit-scrollbar-track { background: #1e293b; }
    .scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-pulse { animation: pulse 2s infinite; }
    .env-tab { transition: all 0.2s; cursor: pointer; }
    .env-tab.active { background: #0ea5e9 !important; color: white; }
    .env-tab:not(.active):hover { background: #334155; }
    .menu-item { transition: all 0.15s; }
    .menu-item.active { background: #0ea5e9; }
    .menu-item:not(.active):hover { background: #334155; }
  </style>
</head>
<body class="bg-slate-900 text-white">
  <div class="flex min-h-screen">
    <!-- 左侧菜单 -->
    <aside class="sidebar fixed h-full bg-slate-800 border-r border-slate-700 flex flex-col z-50">
      <div class="p-4 border-b border-slate-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
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
        
        <p class="text-xs text-slate-500 px-3 py-2 mt-4">配置</p>
        <button onclick="switchPage('launcher-config')" id="menu-launcher-config" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="settings" class="w-4 h-4"></i> Launcher 配置
        </button>
        <button onclick="switchPage('app-config')" id="menu-app-config" class="menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300">
          <i data-lucide="smartphone" class="w-4 h-4"></i> App 配置
        </button>
      </nav>
      
      <div class="p-4 border-t border-slate-700">
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
          
          <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="font-semibold mb-4 flex items-center gap-2"><i data-lucide="git-branch" class="w-4 h-4 text-green-400"></i> 代理配置</h3>
            <div class="space-y-4">
              <div><label class="block text-sm text-slate-400 mb-1">API 代理路径</label><input type="text" id="lc-proxyPath" value="/api" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">代理目标</label><input type="text" id="lc-proxyTarget" placeholder="http://localhost:8080" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"></div>
              <div><label class="block text-sm text-slate-400 mb-1">路径重写</label><select id="lc-proxyRewrite" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="true">是 - 移除前缀</option><option value="false">否 - 保留前缀</option></select></div>
              <div><label class="block text-sm text-slate-400 mb-1">WebSocket 代理</label><select id="lc-proxyWs" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:border-cyan-500 focus:outline-none"><option value="true">开启</option><option value="false">关闭</option></select></div>
            </div>
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

    // 初始化 Lucide 图标
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      connectWS();
      detectFramework();
    });

    function switchPage(page) {
      document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
      document.getElementById('page-' + page).classList.remove('hidden');
      document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById('menu-' + page);
      if (btn) btn.classList.add('active');
      currentPage = page;
      lucide.createIcons();
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
          if (data.type === 'log') log(currentPage, data.payload.level, data.payload.message);
        } catch(err) {}
      };
    }

    function log(page, level, msg) {
      const el = document.getElementById(page + '-console');
      if (!el) return;
      const colors = { info: 'text-cyan-400', warn: 'text-yellow-400', error: 'text-red-400', success: 'text-green-400' };
      const time = new Date().toLocaleTimeString();
      el.innerHTML += '<div class="py-0.5 ' + (colors[level] || 'text-slate-300') + '">[' + time + '] ' + msg + '</div>';
      el.scrollTop = el.scrollHeight;
    }

    function clearLog(page) {
      const el = document.getElementById(page + '-console');
      if (el) el.innerHTML = '<div class="text-slate-500">[已清空]</div>';
    }

    async function startDev() {
      log('dev', 'info', '启动开发服务器...');
      document.getElementById('btn-start-dev').classList.add('hidden');
      document.getElementById('btn-stop-dev').classList.remove('hidden');
      document.getElementById('dev-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span><span class="text-green-400">运行中</span>';
      lucide.createIcons();
      const port = document.getElementById('dev-port').value;
      const host = document.getElementById('dev-host').value;
      try {
        await fetch('/api/action/dev', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ port, host }) });
        log('dev', 'success', '服务器已启动: http://' + host + ':' + port);
      } catch (e) { log('dev', 'error', '启动失败: ' + e.message); }
    }

    function stopDev() {
      log('dev', 'info', '停止服务器...');
      document.getElementById('btn-start-dev').classList.remove('hidden');
      document.getElementById('btn-stop-dev').classList.add('hidden');
      document.getElementById('dev-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>未运行</span>';
      fetch('/api/action/stop', { method: 'POST' });
    }

    function openInBrowser() {
      const port = document.getElementById('dev-port').value;
      const https = document.getElementById('dev-https').value === 'true';
      window.open((https ? 'https' : 'http') + '://localhost:' + port, '_blank');
    }

    async function startBuild() {
      log('build', 'info', '开始构建...');
      document.getElementById('build-progress').classList.remove('hidden');
      document.getElementById('build-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span><span class="text-blue-400">构建中</span>';
      lucide.createIcons();
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        document.getElementById('build-percent').textContent = progress + '%';
        document.getElementById('build-bar').style.width = progress + '%';
        if (progress >= 100) {
          clearInterval(interval);
          document.getElementById('build-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-green-400"></span><span class="text-green-400">完成</span>';
          log('build', 'success', '构建完成！');
        }
      }, 200);
      fetch('/api/action/build', { method: 'POST' });
    }

    function openDistFolder() { log('build', 'info', '打开输出目录: dist/'); }

    async function startPreview() {
      log('preview', 'info', '启动预览服务器...');
      document.getElementById('btn-start-preview').classList.add('hidden');
      document.getElementById('btn-stop-preview').classList.remove('hidden');
      document.getElementById('preview-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span><span class="text-purple-400">运行中</span>';
      lucide.createIcons();
      const port = document.getElementById('preview-port').value;
      try {
        await fetch('/api/action/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ port }) });
        log('preview', 'success', '预览服务器已启动: http://localhost:' + port);
      } catch (e) { log('preview', 'error', '启动失败: ' + e.message); }
    }

    function stopPreview() {
      log('preview', 'info', '停止预览服务器...');
      document.getElementById('btn-start-preview').classList.remove('hidden');
      document.getElementById('btn-stop-preview').classList.add('hidden');
      document.getElementById('preview-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>未运行</span>';
      fetch('/api/action/stop', { method: 'POST' });
    }

    function saveLauncherConfig() {
      const config = {
        env: currentLauncherEnv,
        port: document.getElementById('lc-port').value,
        host: document.getElementById('lc-host').value,
        proxyTarget: document.getElementById('lc-proxyTarget').value
      };
      launcherConfigs[currentLauncherEnv] = config;
      log('dev', 'success', 'Launcher 配置已保存 (' + currentLauncherEnv + ')');
    }

    function saveAppConfig() {
      const config = {
        env: currentAppEnv,
        apiBase: document.getElementById('ac-apiBase').value,
        debug: document.getElementById('ac-debug').value === 'true',
        mock: document.getElementById('ac-mock').value === 'true'
      };
      appConfigs[currentAppEnv] = config;
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
  </script>
</body>
</html>`
}
