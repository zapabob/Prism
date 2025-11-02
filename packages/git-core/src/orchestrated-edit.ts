/**
 * @prism/git-core - Orchestrated Edit
 * 
 * SHA256検証付きアトミック書き込みシステム
 * Codex Rust実装からの完全移植
 */

import * as crypto from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import type {
  OrchestratedEditRequest,
  OrchestratedEditResult
} from '@prism/types'

/**
 * Orchestrated Editor
 * 
 * Preimage SHA256検証により、複数AIの同時編集でも
 * コンフリクトを確実に検出する
 */
export class OrchestratedEditor {
  /**
   * 安全な書き込み（SHA256検証付き）
   * 
   * @param request - 書き込みリクエスト
   * @returns 書き込み結果
   */
  async safeWrite(request: OrchestratedEditRequest): Promise<OrchestratedEditResult> {
    const filePath = path.join(request.repoRoot, request.filePath)
    
    // Preimage SHA検証
    if (request.preimageSHA) {
      const validationResult = await this.validatePreimage(filePath, request.preimageSHA)
      if (!validationResult.valid) {
        return {
          success: false,
          newSHA: validationResult.actualSHA,
          error: validationResult.error
        }
      }
    }
    
    // ディレクトリ作成（必要な場合）
    const dir = path.dirname(filePath)
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      return {
        success: false,
        newSHA: '',
        error: `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`
      }
    }
    
    // ファイル書き込み
    try {
      await fs.writeFile(filePath, request.content, 'utf-8')
    } catch (error) {
      return {
        success: false,
        newSHA: '',
        error: `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
      }
    }
    
    // 書き込み後のSHA256を計算
    const newSHA = await this.computeSHA256(filePath)
    
    return {
      success: true,
      newSHA,
      error: null
    }
  }

  /**
   * バッチ書き込み（複数ファイル）
   * 
   * @param requests - 書き込みリクエストのリスト
   * @returns 書き込み結果のリスト
   */
  async batchWrite(
    requests: OrchestratedEditRequest[]
  ): Promise<OrchestratedEditResult[]> {
    return await Promise.all(
      requests.map(request => this.safeWrite(request))
    )
  }

  /**
   * ファイルのSHA256を計算
   * 
   * @param filePath - 対象ファイルパス
   * @returns SHA256ハッシュ (16進数文字列)
   */
  async computeSHA256(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return this.computeSHA256String(content)
    } catch (error) {
      throw new Error(
        `Failed to compute SHA256: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 文字列のSHA256を計算
   * 
   * @param content - 対象文字列
   * @returns SHA256ハッシュ (16進数文字列)
   */
  computeSHA256String(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content, 'utf-8')
      .digest('hex')
  }

  /**
   * Preimage検証
   */
  private async validatePreimage(
    filePath: string,
    expectedSHA: string
  ): Promise<{ valid: boolean; actualSHA: string; error: string }> {
    const exists = await this.fileExists(filePath)
    
    if (exists) {
      // ファイルが存在する場合、SHA256を比較
      try {
        const actualSHA = await this.computeSHA256(filePath)
        if (actualSHA !== expectedSHA) {
          return {
            valid: false,
            actualSHA,
            error: `Edit conflict: expected SHA ${expectedSHA} but found ${actualSHA}`
          }
        }
        return { valid: true, actualSHA, error: '' }
      } catch (error) {
        return {
          valid: false,
          actualSHA: '',
          error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
        }
      }
    } else {
      // ファイルが存在しない場合、空文字列のSHAと比較
      const emptySHA = this.computeSHA256String('')
      if (expectedSHA !== emptySHA) {
        return {
          valid: false,
          actualSHA: emptySHA,
          error: 'Edit conflict: file does not exist but preimage SHA provided'
        }
      }
      return { valid: true, actualSHA: emptySHA, error: '' }
    }
  }

  /**
   * ファイル存在チェック
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}

/**
 * ヘルパー関数: 安全な書き込み
 */
export async function safeWrite(
  request: OrchestratedEditRequest
): Promise<OrchestratedEditResult> {
  const editor = new OrchestratedEditor()
  return await editor.safeWrite(request)
}

/**
 * ヘルパー関数: バッチ書き込み
 */
export async function batchWrite(
  requests: OrchestratedEditRequest[]
): Promise<OrchestratedEditResult[]> {
  const editor = new OrchestratedEditor()
  return await editor.batchWrite(requests)
}

/**
 * ヘルパー関数: SHA256計算
 */
export async function computeSHA256(filePath: string): Promise<string> {
  const editor = new OrchestratedEditor()
  return await editor.computeSHA256(filePath)
}

/**
 * ヘルパー関数: 文字列SHA256計算
 */
export function computeSHA256String(content: string): string {
  const editor = new OrchestratedEditor()
  return editor.computeSHA256String(content)
}

