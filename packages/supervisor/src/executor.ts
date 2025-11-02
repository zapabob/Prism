/**
 * @prism/supervisor - Executor
 * 
 * 並列AI実行エンジン
 * Codex Rust実装（codex-rs/supervisor/src/executor.rs）からの完全移植
 */

import type {
  Assignment,
  TaskResult,
  SupervisorConfig
} from '@prism/types'

/**
 * 依存関係グラフ
 */
interface DependencyGraph {
  /** ノード（タスク） */
  nodes: Map<string, Assignment>
  /** エッジ（依存関係） */
  edges: Map<string, Set<string>>
  /** 完了済みノード */
  completed: Set<string>
}

/**
 * タスク実行コンテキスト
 */
interface ExecutionContext {
  /** 依存関係グラフ */
  graph: DependencyGraph
  /** 実行結果 */
  results: TaskResult[]
  /** アクティブタスク */
  active: Set<string>
  /** エラーリスト */
  errors: Array<{ stepId: string; error: string }>
  /** 同時実行数制限 */
  concurrencyLimit: number
}

/**
 * プランを実行
 * 
 * @param assignments - タスク割り当てリスト
 * @param config - Supervisor設定
 * @returns 実行結果リスト
 */
export async function executePlan(
  assignments: Assignment[],
  config: SupervisorConfig
): Promise<TaskResult[]> {
  const concurrencyLimit = getConcurrencyLimit(config)
  return await executeWithDependencies(assignments, concurrencyLimit)
}

/**
 * 同時実行数制限を取得
 * 
 * @param config - Supervisor設定
 * @returns 同時実行数
 */
function getConcurrencyLimit(config: SupervisorConfig): number {
  const strategy = config.strategy
  
  if (strategy === 'sequential') {
    return 1
  } else if (strategy === 'parallel') {
    return config.maxParallelAgents
  } else {
    // hybrid
    return Math.max(2, Math.floor(config.maxParallelAgents / 2))
  }
}

/**
 * 依存関係を考慮した実行
 * 
 * @param assignments - タスク割り当てリスト
 * @param concurrencyLimit - 同時実行数制限
 * @returns 実行結果リスト
 */
async function executeWithDependencies(
  assignments: Assignment[],
  concurrencyLimit: number
): Promise<TaskResult[]> {
  // 依存関係グラフ構築
  const graph = buildDependencyGraph(assignments)
  
  // 実行コンテキスト初期化
  const context: ExecutionContext = {
    graph,
    results: [],
    active: new Set(),
    errors: [],
    concurrencyLimit
  }
  
  // 実行ループ
  while (hasRemaining(context)) {
    // 実行可能なタスクを取得
    const ready = getReadyTasks(context)
    
    // デッドロック検出
    if (ready.length === 0 && context.active.size === 0) {
      throw new Error('Dependency deadlock detected')
    }
    
    // バッチサイズ決定
    const availableSlots = context.concurrencyLimit - context.active.size
    const batch = ready.slice(0, availableSlots)
    
    // バッチが空の場合は待機
    if (batch.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
      continue
    }
    
    // バッチ実行
    await Promise.all(
      batch.map(assignment => executeSingleTask(assignment, context))
    )
  }
  
  return context.results
}

/**
 * 単一タスクを実行
 * 
 * @param assignment - タスク割り当て
 * @param context - 実行コンテキスト
 */
async function executeSingleTask(
  assignment: Assignment,
  context: ExecutionContext
): Promise<void> {
  const startTime = Date.now()
  
  // アクティブマークに追加
  context.active.add(assignment.stepId)
  
  try {
    // TODO: 実際のMCP経由のAI実行を実装
    // 現在はモックとして成功を返す
    const output = `Executed ${assignment.task} with ${assignment.agentType}`
    
    const result: TaskResult = {
      stepId: assignment.stepId,
      agentType: assignment.agentType,
      success: true,
      output,
      metrics: {
        testSuccessRate: 1.0,
        lintPassRate: 1.0,
        performanceGain: 0.0,
        changeRisk: 0.1,
        readabilityScore: 0.8,
        securityScore: 0.9
      },
      duration: Date.now() - startTime
    }
    
    context.results.push(result)
  } catch (error) {
    // エラー記録
    const errorMessage = error instanceof Error ? error.message : String(error)
    context.errors.push({
      stepId: assignment.stepId,
      error: errorMessage
    })
    
    const result: TaskResult = {
      stepId: assignment.stepId,
      agentType: assignment.agentType,
      success: false,
      output: '',
      metrics: {
        testSuccessRate: 0,
        lintPassRate: 0,
        performanceGain: 0,
        changeRisk: 1.0,
        readabilityScore: 0,
        securityScore: 0
      },
      error: errorMessage,
      duration: Date.now() - startTime
    }
    
    context.results.push(result)
  } finally {
    // アクティブマークから削除
    context.active.delete(assignment.stepId)
    // 完了マーク
    markComplete(context.graph, assignment.stepId)
  }
}

/**
 * 依存関係グラフを構築
 * 
 * @param assignments - タスク割り当てリスト
 * @returns 依存関係グラフ
 */
function buildDependencyGraph(assignments: Assignment[]): DependencyGraph {
  const graph: DependencyGraph = {
    nodes: new Map(),
    edges: new Map(),
    completed: new Set()
  }
  
  for (const assignment of assignments) {
    graph.nodes.set(assignment.stepId, assignment)
    graph.edges.set(assignment.stepId, new Set(assignment.dependencies))
  }
  
  return graph
}

/**
 * 未完了タスクが残っているか
 * 
 * @param context - 実行コンテキスト
 * @returns 残っている場合true
 */
function hasRemaining(context: ExecutionContext): boolean {
  return context.graph.nodes.size > context.graph.completed.size
}

/**
 * 実行可能なタスクを取得
 * 
 * @param context - 実行コンテキスト
 * @returns 実行可能なタスクリスト
 */
function getReadyTasks(context: ExecutionContext): Assignment[] {
  const ready: Assignment[] = []
  const erroredSteps = new Set(context.errors.map(e => e.stepId))
  
  for (const [stepId, assignment] of context.graph.nodes) {
    // 既に完了またはアクティブの場合はスキップ
    if (context.graph.completed.has(stepId) || context.active.has(stepId)) {
      continue
    }
    
    // 依存タスクがエラーの場合はスキップ
    const hasErroredDependency = assignment.dependencies.some(dep =>
      erroredSteps.has(dep)
    )
    if (hasErroredDependency) {
      continue
    }
    
    // すべての依存が完了済みか確認
    const allDepsComplete = assignment.dependencies.every(dep =>
      context.graph.completed.has(dep)
    )
    
    if (allDepsComplete) {
      ready.push(assignment)
    }
  }
  
  // 優先度順にソート（高い方が先）
  return ready.sort((a, b) => b.priority - a.priority)
}

/**
 * タスクを完了マーク
 * 
 * @param graph - 依存関係グラフ
 * @param stepId - ステップID
 */
function markComplete(graph: DependencyGraph, stepId: string): void {
  graph.completed.add(stepId)
}

/**
 * 循環依存を検出
 * 
 * @param assignments - タスク割り当てリスト
 * @returns 循環が存在する場合true
 */
export function detectCyclicDependencies(assignments: Assignment[]): boolean {
  const graph = buildDependencyGraph(assignments)
  const visited = new Set<string>()
  const recStack = new Set<string>()
  
  function hasCycle(stepId: string): boolean {
    visited.add(stepId)
    recStack.add(stepId)
    
    const deps = graph.edges.get(stepId)
    if (deps) {
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) {
            return true
          }
        } else if (recStack.has(dep)) {
          return true
        }
      }
    }
    
    recStack.delete(stepId)
    return false
  }
  
  for (const stepId of graph.nodes.keys()) {
    if (!visited.has(stepId)) {
      if (hasCycle(stepId)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * トポロジカルソート
 * 
 * @param assignments - タスク割り当てリスト
 * @returns ソート済みタスクリスト
 * @throws Error - 循環依存が存在する場合
 */
export function topologicalSort(assignments: Assignment[]): Assignment[] {
  // 循環依存チェック
  if (detectCyclicDependencies(assignments)) {
    throw new Error('Cyclic dependencies detected')
  }
  
  const graph = buildDependencyGraph(assignments)
  const sorted: Assignment[] = []
  const visited = new Set<string>()
  
  function visit(stepId: string): void {
    if (visited.has(stepId)) {
      return
    }
    
    visited.add(stepId)
    
    // 依存を先に訪問
    const deps = graph.edges.get(stepId)
    if (deps) {
      for (const dep of deps) {
        visit(dep)
      }
    }
    
    // ノードを追加
    const node = graph.nodes.get(stepId)
    if (node) {
      sorted.push(node)
    }
  }
  
  // すべてのノードを訪問
  for (const stepId of graph.nodes.keys()) {
    visit(stepId)
  }
  
  return sorted
}

/**
 * 実行統計を取得
 * 
 * @param results - 実行結果リスト
 * @returns 実行統計
 */
export function getExecutionStats(results: TaskResult[]): {
  total: number
  success: number
  failed: number
  totalDuration: number
  averageDuration: number
} {
  const total = results.length
  const success = results.filter(r => r.success).length
  const failed = total - success
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const averageDuration = total > 0 ? totalDuration / total : 0
  
  return {
    total,
    success,
    failed,
    totalDuration,
    averageDuration
  }
}

