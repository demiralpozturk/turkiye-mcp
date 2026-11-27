import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HttpClient } from './lib/http.js';

/** Shared dependencies handed to every tool (injectable for tests). */
export interface ToolContext {
  http: HttpClient;
  /** Clock, injectable so date-dependent logic is testable. */
  now: () => Date;
}

export type ToolRegistrar = (server: McpServer, ctx: ToolContext) => void;
