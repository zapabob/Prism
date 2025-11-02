/**
 * @prism/supervisor
 * 
 * AI Orchestration Engine with parallel execution for Prism
 */

// Executor
export {
  executePlan,
  detectCyclicDependencies,
  topologicalSort,
  getExecutionStats
} from './executor'

// Re-export types from @prism/types
export type {
  Assignment,
  TaskResult,
  SupervisorConfig,
  CoordinationStrategy,
  MergeStrategy,
  ManagementStyle
} from '@prism/types'

