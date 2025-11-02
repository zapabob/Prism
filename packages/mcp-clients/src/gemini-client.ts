/**
 * @prism/mcp-clients - Gemini MCP Client
 * 
 * Gemini CLI MCP Server client
 */

import { BaseMCPClient } from './base-client'
import type { MCPServerConfig } from '@prism/types'

/**
 * Gemini実行結果
 */
export interface GeminiExecutionResult {
  /** 実行成功フラグ */
  success: boolean
  /** 出力 */
  output: string
  /** エラーメッセージ (失敗時) */
  error?: string
}

/**
 * Gemini MCP Client
 * 
 * Gemini CLI MCPサーバーとの通信
 */
export class GeminiMCPClient extends BaseMCPClient {
  constructor(config?: Partial<MCPServerConfig>) {
    super({
      name: 'gemini-cli',
      command: 'gemini-mcp-server',
      args: [],
      ...config
    })
  }

  /**
   * Geminiでタスクを実行
   * 
   * @param prompt - プロンプト
   * @param options - 実行オプション
   * @returns 実行結果
   */
  async execute(
    prompt: string,
    options?: {
      model?: string
    }
  ): Promise<GeminiExecutionResult> {
    try {
      const result = await this.sendRequest('gemini/execute', {
        prompt,
        model: options?.model ?? 'gemini-2.5-pro'
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

  /**
   * Google Searchを実行
   * 
   * @param query - 検索クエリ
   * @returns 検索結果
   */
  async googleSearch(query: string): Promise<string> {
    const result = await this.sendRequest('gemini/googleSearch', { query })
    return String(result)
  }
}

