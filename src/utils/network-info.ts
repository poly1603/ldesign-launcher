/**
 * 网络信息工具
 * 
 * 用于获取本地和局域网IP地址,检测端口,复制地址到剪贴板等
 * 
 * @author LDesign Team
 * @since 2.1.0
 */

import { networkInterfaces } from 'node:os'
import chalk from 'chalk'
import clipboardy from 'clipboardy'
import detectPort from 'detect-port'

export interface NetworkAddress {
  /** 本地地址 */
  local: string
  /** 局域网地址列表 */
  network: string[]
}

export interface NetworkInterfaceInfo {
  /** 接口名称 */
  name: string
  /** IP地址 */
  address: string
  /** 地址族 */
  family: 'IPv4' | 'IPv6'
  /** 是否内部地址 */
  internal: boolean
}

export class NetworkInfo {
  /**
   * 获取所有网络接口信息
   */
  static getAllInterfaces(): NetworkInterfaceInfo[] {
    const interfaces = networkInterfaces()
    const result: NetworkInterfaceInfo[] = []

    Object.entries(interfaces).forEach(([name, nets]) => {
      nets?.forEach(net => {
        result.push({
          name,
          address: net.address,
          family: net.family as 'IPv4' | 'IPv6',
          internal: net.internal,
        })
      })
    })

    return result
  }

  /**
   * 获取本地IPv4地址列表
   */
  static getLocalAddresses(): string[] {
    const interfaces = networkInterfaces()
    const addresses: string[] = []

    Object.values(interfaces).forEach(nets => {
      nets?.forEach(net => {
        // 只获取IPv4且非内部地址
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address)
        }
      })
    })

    return addresses
  }

  /**
   * 获取主要的局域网地址
   */
  static getPrimaryAddress(): string | null {
    const addresses = this.getLocalAddresses()
    
    // 优先返回192.168.x.x或10.x.x.x段的地址
    const preferred = addresses.find(addr => 
      addr.startsWith('192.168.') || addr.startsWith('10.')
    )
    
    return preferred || addresses[0] || null
  }

  /**
   * 检测端口是否可用
   */
  static async isPortAvailable(port: number, _host: string = '0.0.0.0'): Promise<boolean> {
    try {
      const availablePort = await detectPort(port)
      return availablePort === port
    } catch {
      return false
    }
  }

  /**
   * 查找可用端口
   */
  static async findAvailablePort(
    preferredPort: number,
    _host: string = '0.0.0.0'
  ): Promise<number> {
    try {
      return await detectPort(preferredPort)
    } catch {
      // 如果detectPort失败,返回原端口
      return preferredPort
    }
  }

  /**
   * 格式化URL地址
   */
  static formatUrls(
    _host: string,
    port: number,
    protocol: 'http' | 'https' = 'http'
  ): NetworkAddress {
    const local = `${protocol}://localhost:${port}`
    const addresses = this.getLocalAddresses()
    const network = addresses.map(addr => `${protocol}://${addr}:${port}`)

    return { local, network }
  }

  /**
   * 复制文本到剪贴板
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await clipboardy.write(text)
      return true
    } catch (error) {
      // 静默失败
      return false
    }
  }

  /**
   * 显示网络地址信息
   */
  static displayAddresses(addresses: NetworkAddress, options?: {
    showCopyHint?: boolean
  }): void {
    const { showCopyHint = true } = options || {}

    console.log(chalk.bold.green('\n✨ Development server started\n'))

    // 本地地址
    console.log(
      chalk.gray('➜ ') + 
      chalk.bold('Local:   ') + 
      chalk.cyan(addresses.local)
    )

    // 网络地址
    if (addresses.network.length > 0) {
      addresses.network.forEach((addr, index) => {
        const label = index === 0 ? 'Network: ' : '         '
        console.log(
          chalk.gray('➜ ') + 
          chalk.bold(label) + 
          chalk.cyan(addr)
        )
      })
    }

    // 复制提示
    if (showCopyHint) {
      this.copyToClipboard(addresses.local).then(success => {
        if (success) {
          console.log(chalk.gray('\n✓ Local address copied to clipboard'))
        }
      })
    }
  }

  /**
   * 获取网络接口统计信息
   */
  static getInterfaceStats(): {
    total: number
    ipv4: number
    ipv6: number
    external: number
  } {
    const interfaces = this.getAllInterfaces()
    
    return {
      total: interfaces.length,
      ipv4: interfaces.filter(i => i.family === 'IPv4').length,
      ipv6: interfaces.filter(i => i.family === 'IPv6').length,
      external: interfaces.filter(i => !i.internal).length,
    }
  }

  /**
   * 检查主机名是否为localhost
   */
  static isLocalhost(host: string): boolean {
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
  }

  /**
   * 检查端口是否在有效范围内
   */
  static isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= 0 && port <= 65535
  }

  /**
   * 格式化文件大小
   */
  static formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  /**
   * 格式化时间
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`
    }
    if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`
    }
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * 快捷方法：获取本地地址
 */
export function getLocalAddresses(): string[] {
  return NetworkInfo.getLocalAddresses()
}

/**
 * 快捷方法：格式化URL
 */
export function formatUrls(host: string, port: number, protocol?: 'http' | 'https'): NetworkAddress {
  return NetworkInfo.formatUrls(host, port, protocol)
}

/**
 * 快捷方法：查找可用端口
 */
export async function findAvailablePort(preferredPort: number): Promise<number> {
  return NetworkInfo.findAvailablePort(preferredPort)
}

/**
 * 快捷方法：复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  return NetworkInfo.copyToClipboard(text)
}