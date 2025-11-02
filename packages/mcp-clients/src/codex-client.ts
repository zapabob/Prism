/**
 * @prism/mcp-clients - Codex MCP Client
 * 
 * Codex Official MCP Server client
 */

import { BaseMCPClient } from './base-client'
import type { MCPServerConfig } from '@prism/types'

/**
 * Codex実行結果
 */
export interface CodexExecutionResult {
  /** 実行成功フラグ */
  success: boolean
  /** 出力 */
  output: string
  /** エラーメッセージ (失敗時) */
  error?: string
}

/**
 * Codex MCP Client
 * 
 * Codex Official MCPサーバーとの通信
 */
export class CodexMCPClient extends BaseMCPClient {
  constructor(config?: Partial<MCPServerConfig>) {
    super({
      name: 'codex',
      command: 'codex',
      args: ['mcp-server'],
      ...config
    })
  }

  /**
   * Codexでタスクを実行
   * 
   * @param prompt - プロンプト
   * @param options - 実行オプション
   * @returns 実行結果
   */
  async execute(
    prompt: string,
    options?: {
      model?: string
      sandbox?: 'read-only' | 'workspace-write' | 'danger-full-access'
      approvalPolicy?: 'untrusted' | 'on-failure' | 'on-request' | 'never'
    }
  ): Promise<CodexExecutionResult> {
    try {
      const result = await this.sendRequest('codex/execute', {
        prompt,
        model: options?.model ?? 'gpt-5-codex-medium',
        sandbox: options?.sandbox ?? 'read-only',
        approvalPolicy: options?.approvalPolicy ?? 'on-request'
      })
      
      return {
        success: true,
        output: String(result)
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

