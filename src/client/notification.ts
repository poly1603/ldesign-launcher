/**
 * 配置更新通知组件
 * 
 * 提供美观的配置变更通知弹窗
 * 
 * @author LDesign Team
 * @since 1.0.0
 */

export interface NotificationOptions {
  /** 通知标题 */
  title: string
  /** 通知消息 */
  message: string
  /** 通知类型 */
  type?: 'info' | 'success' | 'warning' | 'error'
  /** 显示时长（毫秒）, 0 表示不自动关闭 */
  duration?: number
  /** 是否可点击关闭 */
  closable?: boolean
  /** 点击回调 */
  onClick?: () => void
  /** 关闭回调 */
  onClose?: () => void
}

/**
 * 通知样式
 */
const NOTIFICATION_STYLES = `
.ldesign-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 320px;
  max-width: 450px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 9999;
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #3b82f6;
}

.ldesign-notification:hover {
  transform: translateX(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ldesign-notification.info {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
}

.ldesign-notification.success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.ldesign-notification.warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
}

.ldesign-notification.error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.ldesign-notification-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}

.ldesign-notification.info .ldesign-notification-icon {
  color: #3b82f6;
}

.ldesign-notification.success .ldesign-notification-icon {
  color: #10b981;
}

.ldesign-notification.warning .ldesign-notification-icon {
  color: #f59e0b;
}

.ldesign-notification.error .ldesign-notification-icon {
  color: #ef4444;
}

.ldesign-notification-content {
  flex: 1;
  min-width: 0;
}

.ldesign-notification-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.ldesign-notification-message {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

.ldesign-notification-close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.ldesign-notification-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.ldesign-notification.closing {
  animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 1, 1);
}
`

/**
 * 图标映射
 */
const ICONS = {
  info: '🔔',
  success: '✅',
  warning: '⚠️',
  error: '❌'
}

class NotificationManager {
  private container: HTMLDivElement | null = null
  private styleElement: HTMLStyleElement | null = null
  private notifications: Map<string, HTMLDivElement> = new Map()
  private notificationCount = 0

  /**
   * 初始化
   */
  private init() {
    if (this.container) return

    // 注入样式
    this.styleElement = document.createElement('style')
    this.styleElement.textContent = NOTIFICATION_STYLES
    document.head.appendChild(this.styleElement)

    // 创建容器
    this.container = document.createElement('div')
    this.container.className = 'ldesign-notification-container'
    document.body.appendChild(this.container)
  }

  /**
   * 显示通知
   */
  show(options: NotificationOptions): string {
    this.init()

    const {
      title,
      message,
      type = 'info',
      duration = 4000,
      closable = true,
      onClick,
      onClose
    } = options

    const id = `notification-${++this.notificationCount}`

    // 创建通知元素
    const notification = document.createElement('div')
    notification.className = `ldesign-notification ${type}`
    notification.id = id

    // 图标
    const icon = document.createElement('div')
    icon.className = 'ldesign-notification-icon'
    icon.textContent = ICONS[type]

    // 内容
    const content = document.createElement('div')
    content.className = 'ldesign-notification-content'

    const titleEl = document.createElement('h4')
    titleEl.className = 'ldesign-notification-title'
    titleEl.textContent = title

    const messageEl = document.createElement('p')
    messageEl.className = 'ldesign-notification-message'
    messageEl.textContent = message

    content.appendChild(titleEl)
    content.appendChild(messageEl)

    notification.appendChild(icon)
    notification.appendChild(content)

    // 关闭按钮
    if (closable) {
      const closeBtn = document.createElement('button')
      closeBtn.className = 'ldesign-notification-close'
      closeBtn.innerHTML = '×'
      closeBtn.onclick = (e) => {
        e.stopPropagation()
        this.close(id)
      }
      notification.appendChild(closeBtn)
    }

    // 点击事件
    if (onClick) {
      notification.onclick = () => {
        onClick()
        this.close(id)
      }
    }

    // 添加到容器
    this.container!.appendChild(notification)
    this.notifications.set(id, notification)

    // 自动关闭
    if (duration > 0) {
      setTimeout(() => {
        this.close(id)
      }, duration)
    }

    return id
  }

  /**
   * 关闭通知
   */
  close(id: string) {
    const notification = this.notifications.get(id)
    if (!notification) return

    notification.classList.add('closing')
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      this.notifications.delete(id)
    }, 300)
  }

  /**
   * 关闭所有通知
   */
  closeAll() {
    this.notifications.forEach((_, id) => {
      this.close(id)
    })
  }

  /**
   * 清理
   */
  destroy() {
    this.closeAll()
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement)
    }

    this.container = null
    this.styleElement = null
    this.notifications.clear()
  }
}

// 创建单例
const notificationManager = new NotificationManager()

/**
 * 显示通知
 */
export function showNotification(options: NotificationOptions): string {
  return notificationManager.show(options)
}

/**
 * 关闭通知
 */
export function closeNotification(id: string): void {
  notificationManager.close(id)
}

/**
 * 关闭所有通知
 */
export function closeAllNotifications(): void {
  notificationManager.closeAll()
}

/**
 * 便捷方法
 */
export const notification = {
  info: (title: string, message: string, duration = 4000) =>
    showNotification({ title, message, type: 'info', duration }),
  
  success: (title: string, message: string, duration = 4000) =>
    showNotification({ title, message, type: 'success', duration }),
  
  warning: (title: string, message: string, duration = 5000) =>
    showNotification({ title, message, type: 'warning', duration }),
  
  error: (title: string, message: string, duration = 6000) =>
    showNotification({ title, message, type: 'error', duration })
}

export default notification
