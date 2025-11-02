/**
 * @prism/git-core - Worktree Manager
 * 
 * Git Worktree管理システム
 * Codex Rust実装からの完全移植
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs/promises'
import type {
  Worktree,
  WorktreeConfig,
  WorktreeInfo,
  MergeResult
} from '@prism/types'

const execAsync = promisify(exec)

/**
 * Worktree Manager
 * 
 * AI毎に独立したWorktreeを作成・管理し、
 * コンフリクトフリーな並列開発を実現する
 */
export class WorktreeManager {
  constructor(private readonly repoRoot: string) {}

  /**
   * 新しいWorktreeを作成
   * 
   * @param config - Worktree設定
   * @returns 作成されたWorktree情報
   * @throws Error - Gitコマンドが失敗した場合
   */
  async create(config: WorktreeConfig): Promise<Worktree> {
    const baseCommit = await this.getCurrentCommit()
    const timestamp = Date.now()
    const worktreePath = path.join(
      this.repoRoot,
      '.prism',
      'worktrees',
      `${config.worktreePrefix}-${config.instanceId}-${timestamp}`
    )
    const branch = `${config.worktreePrefix}/${config.instanceId}/${timestamp}`
    
    // 既存Worktreeの削除（存在する場合）
    if (await this.exists(worktreePath)) {
      await this.removeInternal(worktreePath)
    }
    
    // Worktree作成
    const createCmd = `git worktree add -b "${this.escapeShell(branch)}" "${this.escapeShell(worktreePath)}" "${baseCommit}"`
    try {
      await execAsync(createCmd, { cwd: this.repoRoot })
    } catch (error) {
      throw new Error(
        `Failed to create worktree: ${error instanceof Error ? error.message : String(error)}`
      )
    }
    
    return {
      path: worktreePath,
      branch,
      baseCommit
    }
  }

  /**
   * Worktreeを削除
   * 
   * @param worktree - 削除対象のWorktree
   * @throws Error - 削除が失敗した場合
   */
  async remove(worktree: Worktree): Promise<void> {
    await this.removeInternal(worktree.path)
  }

  /**
   * Worktreeにコミット
   * 
   * @param worktree - 対象Worktree
   * @param message - コミットメッセージ
   * @returns コミットSHA
   * @throws Error - コミットが失敗した場合
   */
  async commit(worktree: Worktree, message: string): Promise<string> {
    try {
      // すべての変更をステージング
      await execAsync('git add -A', { cwd: worktree.path })
      
      // コミット
      const escapedMessage = this.escapeShell(message)
      await execAsync(`git commit -m "${escapedMessage}"`, { cwd: worktree.path })
      
      // コミットSHAを取得
      return await this.getCurrentCommit(worktree.path)
    } catch (error) {
      throw new Error(
        `Failed to commit in worktree: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Worktreeをmainブランチにマージ
   * 
   * @param worktree - マージ対象のWorktree
   * @returns マージ結果
   */
  async merge(worktree: Worktree): Promise<MergeResult> {
    try {
      // mainブランチに切り替え
      await execAsync('git checkout main', { cwd: this.repoRoot })
      
      // マージ実行
      const mergeCmd = `git merge "${this.escapeShell(worktree.branch)}" --no-ff --no-edit -m "Merge AI worktree ${this.escapeShell(worktree.branch)}"`
      await execAsync(mergeCmd, { cwd: this.repoRoot })
      
      // マージ成功
      const commit = await this.getCurrentCommit()
      return { type: 'success', commit }
    } catch (error) {
      // コンフリクトチェック
      const conflicts = await this.getConflicts()
      if (conflicts.length > 0) {
        return { type: 'conflict', conflicts }
      }
      
      // その他のエラー
      throw new Error(
        `Failed to merge worktree: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * すべてのWorktreeをリスト
   * 
   * @returns Worktree情報のリスト
   */
  async listAll(): Promise<WorktreeInfo[]> {
    try {
      const { stdout } = await execAsync('git worktree list --porcelain', {
        cwd: this.repoRoot
      })
      
      return this.parseWorktreeList(stdout)
    } catch (error) {
      throw new Error(
        `Failed to list worktrees: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Worktreeが存在するか確認
   * 
   * @param worktreePath - チェック対象のパス
   * @returns 存在する場合true
   */
  async exists(worktreePath: string): Promise<boolean> {
    try {
      await fs.access(worktreePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 内部用: Worktreeを削除
   */
  private async removeInternal(worktreePath: string): Promise<void> {
    try {
      const removeCmd = `git worktree remove "${this.escapeShell(worktreePath)}" --force`
      await execAsync(removeCmd, { cwd: this.repoRoot })
    } catch (error) {
      // Worktreeが既に削除されている場合は無視
      if (error instanceof Error && error.message.includes('not a working tree')) {
        return
      }
      throw new Error(
        `Failed to remove worktree: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * コンフリクトファイルを取得
   */
  private async getConflicts(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('git diff --name-only --diff-filter=U', {
        cwd: this.repoRoot
      })
      return stdout.trim().split('\n').filter(line => line.length > 0)
    } catch {
      return []
    }
  }

  /**
   * 現在のコミットSHAを取得
   */
  private async getCurrentCommit(cwd: string = this.repoRoot): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd })
      return stdout.trim()
    } catch (error) {
      throw new Error(
        `Failed to get current commit: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Worktreeリスト出力をパース
   */
  private parseWorktreeList(output: string): WorktreeInfo[] {
    const worktrees: WorktreeInfo[] = []
    const lines = output.trim().split('\n')
    
    let current: Partial<WorktreeInfo> = {}
    
    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        current.path = line.substring(9)
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.substring(5)
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7)
      } else if (line.startsWith('locked')) {
        current.locked = true
      } else if (line === '') {
        // 空行で1つのWorktree情報が完了
        if (current.path && current.commit) {
          worktrees.push({
            path: current.path,
            commit: current.commit,
            branch: current.branch ?? null,
            locked: current.locked ?? false
          })
        }
        current = {}
      }
    }
    
    // 最後のWorktree（空行で終わらない場合）
    if (current.path && current.commit) {
      worktrees.push({
        path: current.path,
        commit: current.commit,
        branch: current.branch ?? null,
        locked: current.locked ?? false
      })
    }
    
    return worktrees
  }

  /**
   * シェルエスケープ
   */
  private escapeShell(str: string): string {
    return str.replace(/"/g, '\\"')
  }
}

/**
 * ヘルパー関数: Worktreeを作成
 */
export async function createWorktree(
  repoRoot: string,
  config: WorktreeConfig
): Promise<Worktree> {
  const manager = new WorktreeManager(repoRoot)
  return await manager.create(config)
}

/**
 * ヘルパー関数: Worktreeを削除
 */
export async function removeWorktree(
  repoRoot: string,
  worktree: Worktree
): Promise<void> {
  const manager = new WorktreeManager(repoRoot)
  return await manager.remove(worktree)
}

/**
 * ヘルパー関数: Worktreeをマージ
 */
export async function mergeWorktree(
  repoRoot: string,
  worktree: Worktree
): Promise<MergeResult> {
  const manager = new WorktreeManager(repoRoot)
  return await manager.merge(worktree)
}

/**
 * ヘルパー関数: すべてのWorktreeをリスト
 */
export async function listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
  const manager = new WorktreeManager(repoRoot)
  return await manager.listAll()
}

