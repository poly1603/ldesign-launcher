/**
 * 通知管理器
 */

import { Logger } from './logger'

export interface NotificationManager {
  sendEmail(title: string, message: string): Promise<void>
  sendDingTalk(title: string, message: string): Promise<void>
  sendWebhook(title: string, message: string): Promise<void>
}

export function createNotificationManager(logger: Logger): NotificationManager {
  return {
    async sendEmail(title: string, message: string): Promise<void> {
      logger.info(`[Email] ${title}: ${message}`)
      // TODO: 实现邮件发送
    },

    async sendDingTalk(title: string, message: string): Promise<void> {
      logger.info(`[DingTalk] ${title}: ${message}`)
      // TODO: 实现钉钉通知
    },

    async sendWebhook(title: string, message: string): Promise<void> {
      logger.info(`[Webhook] ${title}: ${message}`)
      // TODO: 实现 Webhook 通知
    }
  }
}