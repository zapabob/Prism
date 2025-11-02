/**
 * @prism/consensus - Scoring System
 * 
 * AI実行結果のスコアリングシステム
 * Codex Rust実装（codex-rs/supervisor/src/scoring.rs）からの完全移植
 */

import type {
  ScoringMetrics,
  ScoringWeights,
  TaskResult
} from '@prism/types'

/**
 * デフォルトスコアリング重み
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  tests: 0.30,
  linting: 0.15,
  performance: 0.20,
  risk: 0.15,
  readability: 0.10,
  security: 0.10
}

/**
 * スコアを計算
 * 
 * @param metrics - スコアリングメトリクス
 * @param weights - スコアリング重み（デフォルト使用可能）
 * @returns 総合スコア（0.0-1.0）
 */
export function calculateScore(
  metrics: ScoringMetrics,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const score =
    metrics.testSuccessRate * weights.tests +
    metrics.lintPassRate * weights.linting +
    metrics.performanceGain * weights.performance -
    metrics.changeRisk * weights.risk +
    metrics.readabilityScore * weights.readability +
    metrics.securityScore * weights.security
  
  // スコアを0.0-1.0の範囲にクランプ
  return Math.max(0, Math.min(1, score))
}

/**
 * 重み付きスコアを計算（複数メトリクス）
 * 
 * @param metricsList - メトリクスリスト
 * @param weights - スコアリング重み
 * @returns スコアリスト
 */
export function calculateScores(
  metricsList: ScoringMetrics[],
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number[] {
  return metricsList.map(metrics => calculateScore(metrics, weights))
}

/**
 * 最高スコアのインデックスを取得
 * 
 * @param scores - スコアリスト
 * @returns 最高スコアのインデックス
 */
export function getBestScoreIndex(scores: number[]): number {
  if (scores.length === 0) {
    throw new Error('Cannot get best score from empty array')
  }
  
  const firstScore = scores[0]
  if (firstScore === undefined) {
    throw new Error('First score is undefined')
  }
  
  let bestIndex = 0
  let bestScore = firstScore
  
  for (let i = 1; i < scores.length; i++) {
    const currentScore = scores[i]
    if (currentScore !== undefined && currentScore > bestScore) {
      bestScore = currentScore
      bestIndex = i
    }
  }
  
  return bestIndex
}

/**
 * スコアランキングを取得
 * 
 * @param scores - スコアリスト
 * @returns ランキング（インデックス配列、スコア降順）
 */
export function getRanking(scores: number[]): number[] {
  return scores
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.index)
}

/**
 * スコア統計を取得
 * 
 * @param scores - スコアリスト
 * @returns 統計情報
 */
export function getScoreStats(scores: number[]): {
  mean: number
  median: number
  min: number
  max: number
  stddev: number
} {
  if (scores.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stddev: 0
    }
  }
  
  // 平均
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
  
  // 中央値
  const sorted = [...scores].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : sorted[mid] ?? 0
  
  // 最小・最大
  const min = sorted[0] ?? 0
  const max = sorted[sorted.length - 1] ?? 0
  
  // 標準偏差
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
  const stddev = Math.sqrt(variance)
  
  return { mean, median, min, max, stddev }
}

/**
 * メトリクスを正規化（0.0-1.0の範囲に）
 * 
 * @param metrics - 正規化前のメトリクス
 * @returns 正規化後のメトリクス
 */
export function normalizeMetrics(metrics: ScoringMetrics): ScoringMetrics {
  return {
    testSuccessRate: clamp(metrics.testSuccessRate, 0, 1),
    lintPassRate: clamp(metrics.lintPassRate, 0, 1),
    performanceGain: clamp(metrics.performanceGain, -1, 1),
    changeRisk: clamp(metrics.changeRisk, 0, 1),
    readabilityScore: clamp(metrics.readabilityScore, 0, 1),
    securityScore: clamp(metrics.securityScore, 0, 1)
  }
}

/**
 * 値を範囲内にクランプ
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * タスク結果からメトリクスを抽出
 * 
 * @param result - タスク結果
 * @returns スコアリングメトリクス
 */
export function extractMetrics(result: TaskResult): ScoringMetrics {
  return normalizeMetrics(result.metrics)
}

/**
 * 複数タスク結果からメトリクスを抽出
 * 
 * @param results - タスク結果リスト
 * @returns メトリクスリスト
 */
export function extractMetricsList(results: TaskResult[]): ScoringMetrics[] {
  return results.map(extractMetrics)
}

/**
 * 重みを正規化（合計を1.0に）
 * 
 * @param weights - 正規化前の重み
 * @returns 正規化後の重み
 */
export function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const total =
    weights.tests +
    weights.linting +
    weights.performance +
    weights.risk +
    weights.readability +
    weights.security
  
  if (total === 0) {
    return DEFAULT_WEIGHTS
  }
  
  return {
    tests: weights.tests / total,
    linting: weights.linting / total,
    performance: weights.performance / total,
    risk: weights.risk / total,
    readability: weights.readability / total,
    security: weights.security / total
  }
}

