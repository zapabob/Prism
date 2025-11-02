/**
 * @prism/mcp-clients - Base MCP Client
 * 
 * すべてのMCPクライアントの基底クラス
 */

import { spawn, type ChildProcess } from 'child_process'
import type { MCPMessage, MCPServerConfig } from '@prism/types'

/**
 * Base MCP Client
 * 
 * JSON-RPC 2.0 over stdin/stdoutプロトコル実装
 */
export abstract class BaseMCPClient {
  protected process?: ChildProcess
  protected requestId = 0
  protected pendingRequests = new Map<number, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()

  constructor(protected readonly config: MCPServerConfig) {}

  /**
   * MCPサーバーを起動
   */
  async start(): Promise<void> {
    if (this.process) {
      throw new Error('MCP server already started')
    }
    
    this.process = spawn(this.config.command, this.config.args, {
      env: { ...process.env, ...this.config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    // stdoutからJSON-RPCレスポンスを読み取り
    if (this.process.stdout) {
      let buffer = ''
      
      this.process.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf-8')
        
        // 改行で分割してメッセージを処理
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        
        for (const line of lines) {
          if (line.trim()) {
            this.handleMessage(line)
          }
        }
      })
    }
    
    // stderrをログ
    if (this.process.stderr) {
      this.process.stderr.on('data', (chunk: Buffer) => {
        console.error(`[${this.config.name}] ${chunk.toString('utf-8')}`)
      })
    }
    
    // プロセス終了時
    this.process.on('exit', (code: number | null) => {
      console.log(`[${this.config.name}] Process exited with code ${code}`)
      this.process = undefined
      
      // すべての保留中のリクエストを拒否
      for (const [id, { reject }] of this.pendingRequests) {
        reject(new Error(`MCP server exited with code ${code}`))
        this.pendingRequests.delete(id)
      }
    })
  }

  /**
   * MCPサーバーを停止
   */
  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM')
      this.process = undefined
    }
  }

  /**
   * リクエストを送信
   * 
   * @param method - メソッド名
   * @param params - パラメータ
   * @returns レスポンス結果
   */
  async sendRequest(method: string, params?: unknown): Promise<unknown> {
    if (!this.process || !this.process.stdin) {
      throw new Error('MCP server not started')
    }
    
    const id = ++this.requestId
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params
    }
    
    // Promiseを作成して保存
    const promise = new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })
    })
    
    // メッセージを送信
    const messageStr = JSON.stringify(message) + '\n'
    this.process.stdin.write(messageStr, 'utf-8')
    
    return await promise
  }

  /**
   * メッセージを処理
   */
  private handleMessage(line: string): void {
    try {
      const message = JSON.parse(line) as MCPMessage
      
      if (message.id !== undefined) {
        const id = typeof message.id === 'number' ? message.id : parseInt(String(message.id), 10)
        const pending = this.pendingRequests.get(id)
        
        if (pending) {
          if (message.error) {
            pending.reject(new Error(message.error.message))
          } else {
            pending.resolve(message.result)
          }
          this.pendingRequests.delete(id)
        }
      }
    } catch (error) {
      console.error(`Failed to parse MCP message: ${line}`, error)
    }
  }

  /**
   * サーバーが起動しているか確認
   */
  isRunning(): boolean {
    return this.process !== undefined && !this.process.killed
  }
}

