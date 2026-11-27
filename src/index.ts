#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { VERSION } from './version.js';

const HELP = `turkiye-mcp ${VERSION}
MCP server (stdio) with Turkish public data for AI assistants.

Usage:
  npx -y turkiye-mcp        start the server on stdio (used by MCP clients)
  node dist/index.js        same, from a local build
  turkiye-mcp --version     print the version
  turkiye-mcp --help        print this help

Docs: https://github.com/demiralpozturk/turkiye-mcp`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`${HELP}\n`);
    return;
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout carries JSON-RPC; diagnostics go to stderr only.
  process.stderr.write(`turkiye-mcp ${VERSION} running on stdio\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`turkiye-mcp failed to start: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
