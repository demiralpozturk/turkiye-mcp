import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext, ToolRegistrar } from './context.js';
import { HttpClient } from './lib/http.js';
import { registerHolidayTool } from './tools/tatiller.js';
import { registerIlIlceTool } from './tools/il-ilce.js';
import { registerValidatorTools } from './tools/dogrulama.js';
import { VERSION } from './version.js';

export const SERVER_INSTRUCTIONS = `turkiye-mcp: Turkish public data for AI assistants.
Unofficial; not affiliated with TCMB, Resmî Gazete, the Ministry of Trade or any public institution.
Validators only check checksums locally; they never look anyone up.`;

/** Tool groups; each one registers its tools on the server. */
const REGISTRARS: ToolRegistrar[] = [registerHolidayTool, registerIlIlceTool, registerValidatorTools];

export interface CreateServerOptions {
  http?: HttpClient;
  now?: () => Date;
}

export function createServer(options: CreateServerOptions = {}): McpServer {
  const server = new McpServer(
    { name: 'turkiye-mcp', version: VERSION },
    { instructions: SERVER_INSTRUCTIONS },
  );
  const ctx: ToolContext = {
    http: options.http ?? new HttpClient(),
    now: options.now ?? (() => new Date()),
  };
  for (const register of REGISTRARS) register(server, ctx);
  return server;
}
