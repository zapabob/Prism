/**
 * @prism/webhook - Webhook Manager
 * 
 * イベント駆動Webhookシステム
 * HMAC-SHA256署名検証付き
 */

import * as crypto from 'crypto'
import type {
  WebhookConfig,
  WebhookPayload,
  WebhookEvent
} from '@prism/types'

/**
 * Webhook送信結果
 */
export interface WebhookDeliveryResult {
  /** Webhook ID */
  webhookId: string
  /** 成功フラグ */
  success: boolean
  /** HTTPステータスコード */
  statusCode?: number
  /** エラーメッセージ (失敗時) */
  error?: string
  /** 送信時刻 */
  timestamp: Date
}

/**
 * Webhook Manager
 * 
 * イベントに応じてWebhookを送信
 */
export class WebhookManager {
  private readonly webhooks: Map<string, WebhookConfig> = new Map()

  /**
   * Webhookを登録
   * 
   * @param config - Webhook設定
   */
  register(config: WebhookConfig): void {
    this.webhooks.set(config.id, config)
  }

  /**
   * Webhookを登録解除
   * 
   * @param id - Webhook ID
   */
  unregister(id: string): void {
    this.webhooks.delete(id)
  }

  /**
   * すべてのWebhookを取得
   * 
   * @returns Webhook設定リスト
   */
  listAll(): WebhookConfig[] {
    return Array.from(this.webhooks.values())
  }

  /**
   * Webhookを取得
   * 
   * @param id - Webhook ID
   * @returns Webhook設定（存在しない場合undefined）
   */
  get(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id)
  }

  /**
   * イベントをトリガー
   * 
   * @param event - イベント種別
   * @param data - イベントデータ
   * @returns 送信結果リスト
   */
  async trigger(
    event: WebhookEvent,
    data: Record<string, unknown>
  ): Promise<WebhookDeliveryResult[]> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date(),
      data
    }
    
    // イベントを購読しているWebhookをフィルタ
    const webhooksToTrigger = Array.from(this.webhooks.values()).filter(
      webhook => webhook.active && webhook.events.includes(event)
    )
    
    // 並列送信
    return await Promise.all(
      webhooksToTrigger.map(webhook => this.sendWebhook(webhook, payload))
    )
  }

  /**
   * Webhookを送信
   * 
   * @param webhook - Webhook設定
   * @param payload - ペイロード
   * @returns 送信結果
   */
  private async sendWebhook(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult> {
    const timestamp = new Date()
    
    try {
      // 署名生成（secretが設定されている場合）
      const signature = webhook.secret
        ? this.generateSignature(payload, webhook.secret)
        : undefined
      
      const payloadWithSignature: WebhookPayload = {
        ...payload,
        signature
      }
      
      // HTTP POSTリクエスト
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prism-Event': payload.event,
          'X-Prism-Signature': signature ?? '',
          'User-Agent': 'Prism-Webhook/1.0'
        },
        body: JSON.stringify(payloadWithSignature),
        signal: AbortSignal.timeout(30000) // 30秒タイムアウト
      })
      
      if (!response.ok) {
        return {
          webhookId: webhook.id,
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp
        }
      }
      
      return {
        webhookId: webhook.id,
        success: true,
        statusCode: response.status,
        timestamp
      }
    } catch (error) {
      return {
        webhookId: webhook.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp
      }
    }
  }

  /**
   * HMAC-SHA256署名を生成
   * 
   * @param payload - ペイロード
   * @param secret - シークレットキー
   * @returns 署名 (16進数文字列)
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify({
      event: payload.event,
      timestamp: payload.timestamp,
      data: payload.data
    })
    
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString, 'utf-8')
      .digest('hex')
  }

  /**
   * 署名を検証
   * 
   * @param payload - ペイロード
   * @param signature - 提供された署名
   * @param secret - シークレットキー
   * @returns 署名が有効な場合true
   */
  verifySignature(
    payload: WebhookPayload,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret)
    
    // タイミング攻撃対策のため、crypto.timingSafeEqualを使用
    try {
      const expectedBuffer = Buffer.from(expectedSignature, 'hex')
      const providedBuffer = Buffer.from(signature, 'hex')
      
      if (expectedBuffer.length !== providedBuffer.length) {
        return false
      }
      
      return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    } catch {
      return false
    }
  }
}

/**
 * ヘルパー: グローバルWebhook Managerインスタンス
 */
let globalManager: WebhookManager | null = null

/**
 * グローバルWebhook Managerを取得
 * 
 * @returns Webhook Manager
 */
export function getGlobalWebhookManager(): WebhookManager {
  if (!globalManager) {
    globalManager = new WebhookManager()
  }
  return globalManager
}

/**
 * ヘルパー: イベントをトリガー
 */
export async function triggerEvent(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  const manager = getGlobalWebhookManager()
  return await manager.trigger(event, data)
}

