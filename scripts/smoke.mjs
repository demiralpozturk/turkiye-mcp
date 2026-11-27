#!/usr/bin/env node
/**
 * End-to-end smoke test: starts the built server (dist/index.js) over stdio, exactly like an
 * MCP client would, lists the tools and calls each one with a realistic argument set.
 *
 *   npm run build && npm run smoke
 *   node scripts/smoke.mjs --full      # print complete JSON results
 */
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const full = process.argv.includes('--full');
const serverPath = fileURLToPath(new URL('../dist/index.js', import.meta.url));

const calls = [
  ['doviz_kurlari', { kodlar: ['USD', 'EUR', 'GBP'] }],
  ['doviz_kurlari', { tarih: '2026-11-22', kodlar: ['USD'] }],
  ['resmi_gazete_gunluk', { kategori: 'gumruk' }],
  ['resmi_gazete_ara', { sorgu: 'gümrük', limit: 3 }],
  ['market_fiyat_ara', { urun: 'zeytinyağı', limit: 2 }],
  ['resmi_tatiller', { yil: 2026 }],
  ['il_ilce', { sorgu: 'Kadıköy' }],
  ['tckn_dogrula', { tckn: '10000000146' }],
  ['vkn_dogrula', { vkn: '1234567890' }],
  ['iban_dogrula', { iban: 'TR33 0006 1005 1978 6457 8413 26' }],
];

const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath], stderr: 'pipe' });
const client = new Client({ name: 'turkiye-mcp-smoke', version: '0.0.0' });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`server: ${JSON.stringify(client.getServerVersion())}`);
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).join(', ')}\n`);

let failures = 0;
for (const [name, args] of calls) {
  const started = Date.now();
  const result = await client.callTool({ name, arguments: args });
  const text = result.content?.find((c) => c.type === 'text')?.text ?? '';
  const ms = Date.now() - started;
  if (result.isError) failures++;
  console.log(`=== ${name} ${JSON.stringify(args)} -> ${result.isError ? 'ERROR' : 'ok'} (${ms} ms)`);
  console.log(full ? text : text.length > 700 ? `${text.slice(0, 700)}\n… (${text.length} chars)` : text);
  console.log();
}

await client.close();
if (failures > 0) {
  console.error(`${failures} tool call(s) returned an error`);
  process.exit(1);
}
