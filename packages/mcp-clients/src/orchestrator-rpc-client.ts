/**
 * @prism/mcp-clients - Orchestrator RPC Client
 * 
 * Orchestrator RPC Server client for coordinated editing
 */

import { BaseMCPClient } from './base-client'
import type { MCPServerConfig } from '@prism/types'

/**
 * ファイルロック情報
 */
export interface FileLock {
  /** ファイルパス */
  filePath: string
  /** ロック保持者 */
  owner: string
  /** ロック取得時刻 */
  acquiredAt: Date
}

/**
 * 書き込み結果
 */
export interface WriteResult {
  /** 成功フラグ */
  success: boolean
  /** 新しいSHA256 */
  newSHA?: string
  /** エラーメッセージ (失敗時) */
  error?: string
}

/**
 * Orchestrator RPC Client
 * 
 * 複数AIの協調編集を調整
 */
export class OrchestratorRPCClient extends BaseMCPClient {
  constructor(config?: Partial<MCPServerConfig>) {
    super({
      name: 'orchestrator-rpc',
      command: 'orchestrator-rpc-server',
      args: [],
      ...config
    })
  }

  /**
   * ファイルロックを取得
   * 
   * @param files - ロック対象ファイルリスト
   * @param owner - ロック保持者ID
   * @returns ロック取得成功の場合true
   */
  async acquireLock(files: string[], owner: string): Promise<boolean> {
    try {
      const result = await this.sendRequest('orchestrator/acquireLock', {
        files,
        owner
      })
      return Boolean(result)
    } catch {
      return false
    }
  }

  /**
   * ファイルロックを解放
   * 
   * @param files - ロック解放対象ファイルリスト
   * @param owner - ロック保持者ID
   */
  async releaseLock(files: string[], owner: string): Promise<void> {
    await this.sendRequest('orchestrator/releaseLock', { files, owner })
  }

  /**
   * 協調書き込み
   * 
   * @param file - ファイルパス
   * @param content - 内容
   * @param owner - 書き込み者ID
   * @returns 書き込み結果
   */
  async coordinatedWrite(
    file: string,
    content: string,
    owner: string
  ): Promise<WriteResult> {
    try {
      const result = await this.sendRequest('orchestrator/write', {
        file,
        content,
        owner
      }) as { success: boolean; newSHA?: string }
      
      return {
        success: result.success,
        newSHA: result.newSHA
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * ロック状態を取得
   * 
   * @returns ファイルロックリスト
   */
  async getLockStatus(): Promise<FileLock[]> {
    const result = await this.sendRequest('orchestrator/lockStatus')
    return result as FileLock[]
  }
}

