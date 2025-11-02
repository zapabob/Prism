/**
 * @prism/consensus
 * 
 * Voting and scoring system for multi-AI results
 */

// Consensus Builder
export {
  ConsensusBuilder,
  buildConsensus,
  buildSolutions,
  generateAutoVotes
} from './builder'

// Scoring System
export {
  calculateScore,
  calculateScores,
  getBestScoreIndex,
  getRanking,
  getScoreStats,
  normalizeMetrics,
  extractMetrics,
  extractMetricsList,
  normalizeWeights,
  DEFAULT_WEIGHTS
} from './scoring'

// Re-export types from @prism/types
export type {
  AgentVote,
  ConsensusResult,
  ConsensusStrategy,
  DecisionLog,
  ScoringMetrics,
  ScoringWeights,
  TaskResult
} from '@prism/types'

