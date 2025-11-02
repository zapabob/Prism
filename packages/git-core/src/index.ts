/**
 * @prism/git-core
 * 
 * Git Worktree management and orchestrated edit for Prism
 */

// Worktree Manager
export {
  WorktreeManager,
  createWorktree,
  removeWorktree,
  mergeWorktree,
  listWorktrees
} from './worktree-manager'

// Orchestrated Edit
export {
  OrchestratedEditor,
  safeWrite,
  batchWrite,
  computeSHA256,
  computeSHA256String
} from './orchestrated-edit'

// Re-export types from @prism/types
export type {
  Worktree,
  WorktreeConfig,
  WorktreeInfo,
  MergeResult,
  OrchestratedEditRequest,
  OrchestratedEditResult
} from '@prism/types'

