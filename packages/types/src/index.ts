/**
 * @prism/types - Shared TypeScript types for Prism monorepo
 * 
 * Strict typing with no 'any' allowed
 * Based on Codex v1.0.0 architecture
 */

// ============================================================================
// Git関連型
// ============================================================================

/**
 * 3D空間におけるGitコミット情報
 */
export interface Commit3D {
  /** コミットSHA */
  sha: string
  /** コミットメッセージ */
  message: string
  /** 作成者名 */
  author: string
  /** 作成者メールアドレス */
  authorEmail: string
  /** コミット日時 */
  timestamp: Date
  /** ブランチ名 */
  branch: string
  /** 親コミットのSHAリスト */
  parents: string[]
  /** 3D空間のX座標 */
  x: number
  /** 3D空間のY座標 (時間軸) */
  y: number
  /** 3D空間のZ座標 */
  z: number
  /** 可視化用の色 */
  color: string
}

/**
 * ファイル変更統計情報
 */
export interface FileStats {
  /** ファイルパス */
  path: string
  /** 追加行数 */
  additions: number
  /** 削除行数 */
  deletions: number
  /** コミット数 */
  commits: number
  /** 最終更新日時 */
  lastModified: Date
  /** ヒートマップ強度 (0.0-1.0) */
  heatmapIntensity: number
}

/**
 * 3D空間におけるブランチノード
 */
export interface BranchNode {
  /** ブランチ名 */
  name: string
  /** 最新コミットSHA */
  commit: string
  /** 3D空間のX座標 */
  x: number
  /** 3D空間のY座標 */
  y: number
  /** 3D空間のZ座標 */
  z: number
  /** 子ブランチのSHAリスト */
  children: string[]
}

// ============================================================================
// Worktree関連型
// ============================================================================

/**
 * Worktree作成設定
 */
export interface WorktreeConfig {
  /** リポジトリルートパス */
  repoRoot: string
  /** Worktree名プレフィックス */
  worktreePrefix: string
  /** AIインスタンスID */
  instanceId: string
}

/**
 * Worktree情報
 */
export interface Worktree {
  /** Worktreeパス */
  path: string
  /** ブランチ名 */
  branch: string
  /** ベースコミットSHA */
  baseCommit: string
}

/**
 * Worktree詳細情報
 */
export interface WorktreeInfo {
  /** Worktreeパス */
  path: string
  /** 現在のコミットSHA */
  commit: string
  /** ブランチ名 (nullの場合はdetached HEAD) */
  branch: string | null
  /** ロック状態 */
  locked: boolean
}

/**
 * マージ結果
 */
export type MergeResult =
  | { type: 'success'; commit: string }
  | { type: 'conflict'; conflicts: string[] }

// ============================================================================
// Orchestrated Edit関連型
// ============================================================================

/**
 * Orchestrated Edit要求
 */
export interface OrchestratedEditRequest {
  /** リポジトリルートパス */
  repoRoot: string
  /** 編集対象ファイルパス */
  filePath: string
  /** 新しいファイル内容 */
  content: string
  /** 期待されるPreimage SHA256 (コンフリクト検出用) */
  preimageSHA?: string
}

/**
 * Orchestrated Edit結果
 */
export interface OrchestratedEditResult {
  /** 成功フラグ */
  success: boolean
  /** 書き込み後のファイルSHA256 */
  newSHA: string
  /** エラーメッセージ (失敗時) */
  error: string | null
}

// ============================================================================
// Supervisor関連型
// ============================================================================

/**
 * AI調整戦略
 */
export enum CoordinationStrategy {
  /** 順次実行 */
  Sequential = 'sequential',
  /** 並列実行 */
  Parallel = 'parallel',
  /** ハイブリッド (依存関係を考慮した並列) */
  Hybrid = 'hybrid'
}

/**
 * 結果マージ戦略
 */
export enum MergeStrategy {
  /** 連結 */
  Concatenate = 'concatenate',
  /** 投票 */
  Voting = 'voting',
  /** 最高スコア */
  HighestScore = 'highest_score'
}

/**
 * 管理スタイル
 */
export enum ManagementStyle {
  /** 中央集権型 (1つのメインAIが統括) */
  Centralized = 'centralized',
  /** 競争型 (複数AIが独立して作業) */
  Competition = 'competition',
  /** 協調型 (AIが協力して作業) */
  Collaborative = 'collaborative'
}

/**
 * Supervisor設定
 */
export interface SupervisorConfig {
  /** 調整戦略 */
  strategy: CoordinationStrategy
  /** 最大並列AI数 */
  maxParallelAgents: number
  /** マージ戦略 */
  mergeStrategy: MergeStrategy
  /** 管理スタイル */
  managementStyle: ManagementStyle
}

/**
 * タスク割り当て
 */
export interface Assignment {
  /** ステップID */
  stepId: string
  /** エージェント種別 */
  agentType: string
  /** タスク内容 */
  task: string
  /** 依存するステップIDリスト */
  dependencies: string[]
  /** ドメイン (例: "backend", "frontend") */
  domain: string
  /** 優先度 (高いほど優先) */
  priority: number
}

/**
 * タスク実行結果
 */
export interface TaskResult {
  /** ステップID */
  stepId: string
  /** エージェント種別 */
  agentType: string
  /** 成功フラグ */
  success: boolean
  /** 出力内容 */
  output: string
  /** 評価メトリクス */
  metrics: ScoringMetrics
  /** エラーメッセージ (失敗時) */
  error?: string
  /** 実行時間 (ms) */
  duration: number
}

// ============================================================================
// Consensus関連型
// ============================================================================

/**
 * スコアリングメトリクス
 */
export interface ScoringMetrics {
  /** テスト成功率 (0.0-1.0) */
  testSuccessRate: number
  /** Lintパス率 (0.0-1.0) */
  lintPassRate: number
  /** パフォーマンス向上率 (-1.0 to 1.0) */
  performanceGain: number
  /** 変更リスク (0.0-1.0, 低いほど良い) */
  changeRisk: number
  /** 可読性スコア (0.0-1.0) */
  readabilityScore: number
  /** セキュリティスコア (0.0-1.0) */
  securityScore: number
}

/**
 * スコアリング重み
 */
export interface ScoringWeights {
  /** テスト重み */
  tests: number
  /** Linting重み */
  linting: number
  /** パフォーマンス重み */
  performance: number
  /** リスク重み */
  risk: number
  /** 可読性重み */
  readability: number
  /** セキュリティ重み */
  security: number
}

/**
 * エージェント投票
 */
export interface AgentVote {
  /** エージェント名 */
  agentName: string
  /** 推奨ソリューションID */
  preferredSolution: string
  /** 信頼度 (0.0-1.0) */
  confidence: number
  /** 投票理由 */
  reasoning: string
}

/**
 * コンセンサス結果
 */
export interface ConsensusResult {
  /** 選択されたソリューションID */
  selectedSolution: string
  /** 選択戦略 */
  selectionStrategy: string
  /** 最終スコア */
  finalScore: number
  /** 投票リスト */
  votes: AgentVote[]
  /** 決定ログ */
  decisionLog: DecisionLog
}

/**
 * 決定ログ
 */
export interface DecisionLog {
  /** タイムスタンプ */
  timestamp: Date
  /** 参加者リスト */
  participants: string[]
  /** 投票ラウンド数 */
  votingRounds: number
  /** 最終決定 */
  finalDecision: string
}

// ============================================================================
// Multi-AI関連型
// ============================================================================

/**
 * オーケストレーションモード
 */
export enum OrchestrationMode {
  /** 中央集権型 */
  Centralized = 'centralized',
  /** 競争型 */
  Competition = 'competition',
  /** 協調型 */
  Collaborative = 'collaborative'
}

/**
 * AIインスタンス
 */
export interface AIInstance {
  /** インスタンスID */
  id: string
  /** 表示名 */
  name: string
  /** プロバイダー */
  provider: 'codex' | 'gemini' | 'claude' | 'openai' | 'anthropic'
  /** モデル名 */
  model: string
  /** 割り当てられたWorktree */
  worktree?: Worktree
  /** 現在のステータス */
  status: AIStatus
}

/**
 * AIステータス
 */
export enum AIStatus {
  /** アイドル */
  Idle = 'idle',
  /** 実行中 */
  Running = 'running',
  /** 完了 */
  Completed = 'completed',
  /** 失敗 */
  Failed = 'failed',
  /** 投票中 */
  Voting = 'voting'
}

/**
 * Multi-AI設定
 */
export interface MultiAIConfig {
  /** オーケストレーションモード */
  mode: OrchestrationMode
  /** AIインスタンスリスト */
  ais: AIInstance[]
  /** タスク内容 */
  task: string
  /** リポジトリパス */
  repoPath: string
  /** コンセンサス戦略 */
  consensusStrategy: ConsensusStrategy
  /** タイムアウト (ms, オプショナル) */
  timeout?: number
}

/**
 * コンセンサス戦略
 */
export enum ConsensusStrategy {
  /** 最高スコア */
  HighestScore = 'highest_score',
  /** 多数決 */
  MajorityVote = 'majority_vote',
  /** 重み付き投票 */
  WeightedVote = 'weighted_vote',
  /** 全員一致 */
  Unanimous = 'unanimous'
}

/**
 * 起動結果
 */
export interface LaunchResult {
  /** タスク結果リスト */
  results: TaskResult[]
  /** コンセンサス結果 (競争モード時) */
  consensus?: ConsensusResult
  /** 勝者AI (競争モード時) */
  winner?: AIInstance
  /** 総実行時間 (ms) */
  duration: number
}

// ============================================================================
// Blueprint関連型
// ============================================================================

/**
 * Blueprint定義
 */
export interface Blueprint {
  /** Blueprint ID */
  id: string
  /** Blueprint名 */
  name: string
  /** バージョン */
  version: string
  /** 説明 */
  description: string
  /** 作成者 */
  author: string
  /** 作成日時 */
  createdAt: Date
  /** 更新日時 */
  updatedAt: Date
  /** ステップリスト */
  steps: BlueprintStep[]
  /** 依存関係 */
  dependencies: string[]
  /** メタデータ */
  metadata: Record<string, unknown>
}

/**
 * Blueprintステップ
 */
export interface BlueprintStep {
  /** ステップID */
  id: string
  /** ステップ種別 */
  type: 'code' | 'test' | 'review' | 'research' | 'custom'
  /** 説明 */
  description: string
  /** 使用するエージェント (オプショナル) */
  agent?: string
  /** 入力パラメータ */
  inputs: Record<string, unknown>
  /** 出力変数名リスト */
  outputs: string[]
  /** 成功条件 */
  successCriteria: SuccessCriteria[]
}

/**
 * 成功条件
 */
export interface SuccessCriteria {
  /** メトリクス名 */
  metric: string
  /** 比較演算子 */
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  /** 期待値 */
  value: number | string
}

// ============================================================================
// Webhook関連型
// ============================================================================

/**
 * Webhook設定
 */
export interface WebhookConfig {
  /** Webhook ID */
  id: string
  /** Webhook名 */
  name: string
  /** 送信先URL */
  url: string
  /** 購読イベントリスト */
  events: WebhookEvent[]
  /** シークレットキー (署名用, オプショナル) */
  secret?: string
  /** 有効フラグ */
  active: boolean
}

/**
 * Webhookイベント
 */
export enum WebhookEvent {
  /** オーケストレーション開始 */
  OrchestrationStart = 'orchestration.start',
  /** オーケストレーション完了 */
  OrchestrationComplete = 'orchestration.complete',
  /** タスク完了 */
  TaskComplete = 'task.complete',
  /** コンセンサス到達 */
  ConsensusReached = 'consensus.reached',
  /** Gitコミット */
  GitCommit = 'git.commit',
  /** Gitマージ */
  GitMerge = 'git.merge'
}

/**
 * Webhookペイロード
 */
export interface WebhookPayload {
  /** イベント種別 */
  event: WebhookEvent
  /** タイムスタンプ */
  timestamp: Date
  /** イベントデータ */
  data: Record<string, unknown>
  /** 署名 (secretが設定されている場合) */
  signature?: string
}

// ============================================================================
// MCP (Model Context Protocol)関連型
// ============================================================================

/**
 * MCPメッセージ
 */
export interface MCPMessage {
  /** JSON-RPCバージョン */
  jsonrpc: '2.0'
  /** リクエストID (オプショナル) */
  id?: number | string
  /** メソッド名 (リクエスト時) */
  method?: string
  /** パラメータ (リクエスト時) */
  params?: unknown
  /** 結果 (レスポンス時) */
  result?: unknown
  /** エラー (エラーレスポンス時) */
  error?: MCPError
}

/**
 * MCPエラー
 */
export interface MCPError {
  /** エラーコード */
  code: number
  /** エラーメッセージ */
  message: string
  /** 追加データ (オプショナル) */
  data?: unknown
}

/**
 * MCPサーバー設定
 */
export interface MCPServerConfig {
  /** サーバー名 */
  name: string
  /** 実行コマンド */
  command: string
  /** コマンド引数 */
  args: string[]
  /** 環境変数 (オプショナル) */
  env?: Record<string, string>
}

// ============================================================================
// Kernel Extension関連型
// ============================================================================

/**
 * カーネル統計情報
 */
export interface KernelStats {
  /** 検出されたAIタスク数 */
  aiTasksDetected: number
  /** 優先度ブースト回数 */
  priorityBoosts: number
  /** GPU割り当て回数 */
  gpuAllocations: number
  /** 平均レイテンシ (ms) */
  averageLatency: number
}

/**
 * GPU割り当て情報
 */
export interface GPUAllocation {
  /** プロセスID */
  pid: number
  /** デバイスID */
  deviceId: number
  /** メモリサイズ (bytes) */
  memorySize: number
  /** 割り当て時刻 */
  timestamp: Date
}

// ============================================================================
// ユーティリティ型
// ============================================================================

/**
 * 非nullableな型を作成
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * オブジェクトの値の型を取得
 */
export type ValueOf<T> = T[keyof T]

/**
 * Promiseの解決値の型を取得
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T

/**
 * 再帰的にPartialにする
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 再帰的にReadonlyにする
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// ============================================================================
// エクスポート
// ============================================================================

// すべての型をエクスポート済み
// any型の使用は一切なし
// strict型チェック完全準拠

