/**
 * @prism/consensus - Consensus Builder
 * 
 * 複数AI結果からコンセンサスを構築
 * Codex Rust実装（codex-rs/supervisor/src/consensus.rs）からの完全移植
 */

import type {
  AgentVote,
  ConsensusResult,
  ConsensusStrategy,
  DecisionLog,
  ScoringMetrics,
  TaskResult
} from '@prism/types'
import { calculateScore } from './scoring'

/**
 * ソリューションとメトリクス
 */
interface SolutionWithMetrics {
  /** ソリューションID */
  id: string
  /** メトリクス */
  metrics: ScoringMetrics
  /** 出力内容 */
  output: string
}

/**
 * Consensus Builder
 * 
 * 複数AIの結果から最適解を選択
 */
export class ConsensusBuilder {
  /**
   * コンセンサスを構築
   * 
   * @param votes - 投票リスト
   * @param solutions - ソリューションリスト
   * @param strategy - コンセンサス戦略
   * @returns コンセンサス結果
   */
  async build(
    votes: AgentVote[],
    solutions: SolutionWithMetrics[],
    strategy: ConsensusStrategy
  ): Promise<ConsensusResult> {
    const strategyName = strategy
    
    if (strategyName === 'highest_score') {
      return this.selectByHighestScore(votes, solutions)
    } else if (strategyName === 'majority_vote') {
      return this.selectByMajorityVote(votes, solutions)
    } else if (strategyName === 'weighted_vote') {
      return this.selectByWeightedVote(votes, solutions)
    } else {
      // unanimous
      return this.selectByUnanimous(votes, solutions)
    }
  }

  /**
   * 最高スコアで選択
   */
  private selectByHighestScore(
    votes: AgentVote[],
    solutions: SolutionWithMetrics[]
  ): ConsensusResult {
    if (solutions.length === 0) {
      throw new Error('No solutions provided')
    }
    
    const firstSolution = solutions[0]
    if (!firstSolution) {
      throw new Error('First solution is undefined')
    }
    
    let bestSolution = firstSolution
    let bestScore = calculateScore(bestSolution.metrics)
    
    for (let i = 1; i < solutions.length; i++) {
      const solution = solutions[i]
      if (!solution) continue
      
      const score = calculateScore(solution.metrics)
      if (score > bestScore) {
        bestScore = score
        bestSolution = solution
      }
    }
    
    return {
      selectedSolution: bestSolution.id,
      selectionStrategy: 'highest_score',
      finalScore: bestScore,
      votes,
      decisionLog: this.createDecisionLog(votes, 'HighestScore')
    }
  }

  /**
   * 多数決で選択
   */
  private selectByMajorityVote(
    votes: AgentVote[],
    solutions: SolutionWithMetrics[]
  ): ConsensusResult {
    if (votes.length === 0) {
      throw new Error('No votes provided')
    }
    
    // 投票集計
    const voteCounts = new Map<string, number>()
    
    for (const vote of votes) {
      const count = voteCounts.get(vote.preferredSolution) ?? 0
      voteCounts.set(vote.preferredSolution, count + 1)
    }
    
    // 最多得票を取得
    let selectedSolution = ''
    let maxVotes = 0
    
    for (const [solutionId, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count
        selectedSolution = solutionId
      }
    }
    
    // スコア計算
    const solution = solutions.find(s => s.id === selectedSolution)
    const finalScore = solution ? calculateScore(solution.metrics) : 0
    
    return {
      selectedSolution,
      selectionStrategy: 'majority_vote',
      finalScore,
      votes,
      decisionLog: this.createDecisionLog(votes, 'MajorityVote')
    }
  }

  /**
   * 重み付き投票で選択
   */
  private selectByWeightedVote(
    votes: AgentVote[],
    solutions: SolutionWithMetrics[]
  ): ConsensusResult {
    if (votes.length === 0) {
      throw new Error('No votes provided')
    }
    
    // 信頼度で重み付けした投票集計
    const weightedScores = new Map<string, number>()
    
    for (const vote of votes) {
      const score = weightedScores.get(vote.preferredSolution) ?? 0
      weightedScores.set(vote.preferredSolution, score + vote.confidence)
    }
    
    // 最高加重スコアを取得
    let selectedSolution = ''
    let maxScore = 0
    
    for (const [solutionId, score] of weightedScores) {
      if (score > maxScore) {
        maxScore = score
        selectedSolution = solutionId
      }
    }
    
    // 最終スコア計算
    const solution = solutions.find(s => s.id === selectedSolution)
    const finalScore = solution ? calculateScore(solution.metrics) : 0
    
    return {
      selectedSolution,
      selectionStrategy: 'weighted_vote',
      finalScore,
      votes,
      decisionLog: this.createDecisionLog(votes, 'WeightedVote')
    }
  }

  /**
   * 全員一致で選択
   */
  private selectByUnanimous(
    votes: AgentVote[],
    solutions: SolutionWithMetrics[]
  ): ConsensusResult {
    if (votes.length === 0) {
      throw new Error('No votes provided')
    }
    
    // すべて同じソリューションに投票しているか確認
    const firstPreference = votes[0]?.preferredSolution
    const isUnanimous = votes.every(vote => vote.preferredSolution === firstPreference)
    
    if (!isUnanimous) {
      throw new Error('Unanimous consensus not reached')
    }
    
    const selectedSolution = firstPreference ?? ''
    
    // スコア計算
    const solution = solutions.find(s => s.id === selectedSolution)
    const finalScore = solution ? calculateScore(solution.metrics) : 0
    
    return {
      selectedSolution,
      selectionStrategy: 'unanimous',
      finalScore,
      votes,
      decisionLog: this.createDecisionLog(votes, 'Unanimous')
    }
  }

  /**
   * 決定ログを作成
   */
  private createDecisionLog(
    votes: AgentVote[],
    strategy: string
  ): DecisionLog {
    return {
      timestamp: new Date(),
      participants: votes.map(v => v.agentName),
      votingRounds: 1,
      finalDecision: strategy
    }
  }
}

/**
 * タスク結果からソリューションを構築
 * 
 * @param results - タスク結果リスト
 * @returns ソリューションリスト
 */
export function buildSolutions(results: TaskResult[]): SolutionWithMetrics[] {
  return results.map(result => ({
    id: result.stepId,
    metrics: result.metrics,
    output: result.output
  }))
}

/**
 * 簡易投票を生成（自動）
 * 
 * 各AIが自分の結果に投票し、信頼度はスコアベース
 * 
 * @param results - タスク結果リスト
 * @returns 投票リスト
 */
export function generateAutoVotes(results: TaskResult[]): AgentVote[] {
  return results.map(result => {
    const score = calculateScore(result.metrics)
    
    return {
      agentName: result.agentType,
      preferredSolution: result.stepId,
      confidence: score,
      reasoning: `Auto-generated vote based on score: ${score.toFixed(2)}`
    }
  })
}

/**
 * ヘルパー: コンセンサスを構築
 */
export async function buildConsensus(
  results: TaskResult[],
  strategy: ConsensusStrategy
): Promise<ConsensusResult> {
  const solutions = buildSolutions(results)
  const votes = generateAutoVotes(results)
  
  const builder = new ConsensusBuilder()
  return await builder.build(votes, solutions, strategy)
}

