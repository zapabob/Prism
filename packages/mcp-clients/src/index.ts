/**
 * @prism/mcp-clients
 * 
 * MCP client collection for Prism
 */

// Base Client
export { BaseMCPClient } from './base-client'

// Codex Client
export {
  CodexMCPClient
} from './codex-client'

export type {
  CodexExecutionResult
} from './codex-client'

// Gemini Client
export {
  GeminiMCPClient
} from './gemini-client'

export type {
  GeminiExecutionResult
} from './gemini-client'

// Orchestrator RPC Client
export {
  OrchestratorRPCClient
} from './orchestrator-rpc-client'

export type {
  FileLock,
  WriteResult
} from './orchestrator-rpc-client'

// Re-export types from @prism/types
export type {
  MCPMessage,
  MCPError,
  MCPServerConfig
} from '@prism/types'

