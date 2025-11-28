/**
 * QRCode 二维码组件
 *
 * 用于在终端中显示二维码,方便移动设备扫码访问
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import chalk from 'chalk'
import qrcodeTerminal from 'qrcode-terminal'

export interface QRCodeOptions {
  /** 是否使用小尺寸 */
  small?: boolean
}

export interface QRCodeDisplayOptions {
  /** 本地地址 */
  local: string
  /** 网络地址 */
  network?: string | string[]
  /** 标题 */
  title?: string
  /** 是否显示地址文本 */
  showUrl?: boolean
}

export class QRCode {
  /**
   * 生成二维码
   */
  static generate(url: string, options: QRCodeOptions = {}): void {
    try {
      qrcodeTerminal.generate(url, {
        small: options.small ?? true,
      })
    }
    catch (error) {
      console.error(chalk.red('二维码生成失败:'), error)
    }
  }

  /**
   * 显示访问地址二维码
   */
  static display(options: QRCodeDisplayOptions): void {
    const { local, network, title = '📱 扫码访问', showUrl = true } = options

    console.log(chalk.bold.cyan(`\n${title}\n`))

    // 显示本地地址二维码
    if (local) {
      console.log(chalk.gray('本地地址:'))
      this.generate(local, { small: true })
      if (showUrl) {
        console.log(chalk.cyan(local))
      }
    }

    // 显示网络地址
    if (network) {
      const networkUrls = Array.isArray(network) ? network : [network]
      if (networkUrls.length > 0) {
        console.log(chalk.gray('\n局域网地址:'))
        networkUrls.forEach((url) => {
          console.log(chalk.cyan(url))
        })
      }
    }

    console.log('') // 空行
  }

  /**
   * 生成并返回二维码字符串
   */
  static generateString(url: string, _options: QRCodeOptions = {}): string {
    return new Promise((resolve, reject) => {
      try {
        // 使用 qrcode 库生成字符串（如果可用）
        // 这里暂时返回提示信息
        resolve(`QR Code for: ${url}`)
      }
      catch (error) {
        reject(error)
      }
    }) as any
  }

  /**
   * 显示多个地址的二维码
   */
  static displayMultiple(urls: Array<{ label: string, url: string }>): void {
    console.log(chalk.bold.cyan('\n📱 扫码访问\n'))

    urls.forEach(({ label, url }, index) => {
      if (index > 0) {
        console.log('') // 分隔
      }
      console.log(chalk.gray(`${label}:`))
      this.generate(url, { small: true })
      console.log(chalk.cyan(url))
    })

    console.log('') // 空行
  }

  /**
   * 显示简洁的二维码（仅显示一个地址）
   */
  static displayCompact(url: string, label?: string): void {
    if (label) {
      console.log(chalk.gray(`\n${label}:`))
    }
    this.generate(url, { small: true })
    console.log(`${chalk.cyan(url)}\n`)
  }
}

/**
 * 快捷方法：生成二维码
 */
export function generateQRCode(url: string, options?: QRCodeOptions): void {
  QRCode.generate(url, options)
}

/**
 * 快捷方法：显示访问地址二维码
 */
export function displayQRCode(options: QRCodeDisplayOptions): void {
  QRCode.display(options)
}
