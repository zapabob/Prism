/**
 * @prism/webhook
 * 
 * Event-driven webhook system for Prism
 */

// Webhook Manager
export {
  WebhookManager,
  getGlobalWebhookManager,
  triggerEvent
} from './manager'

export type {
  WebhookDeliveryResult
} from './manager'

// Re-export types from @prism/types
export type {
  WebhookConfig,
  WebhookPayload,
  WebhookEvent
} from '@prism/types'

