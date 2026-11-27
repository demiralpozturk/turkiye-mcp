import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext, ToolRegistrar } from './context.js';
import { HttpClient } from './lib/http.js';
import { registerExchangeRateTool } from './tools/doviz.js';
import { registerMarketTool } from './tools/market.js';
import { registerResmiGazeteTools } from './tools/resmi-gazete.js';
import { registerHolidayTool } from './tools/tatiller.js';
import { registerIlIlceTool } from './tools/il-ilce.js';
import { registerValidatorTools } from './tools/dogrulama.js';
import { VERSION } from './version.js';

export const SERVER_INSTRUCTIONS = `turkiye-mcp: Turkish public data for AI assistants.
- doviz_kurlari: TCMB indicative exchange rates (latest or a past date; weekends/holidays fall back to the last bulletin).
- resmi_gazete_gunluk / resmi_gazete_ara: Official Gazette contents by day, and search over the last 90 days.
- market_fiyat_ara: branch-level supermarket prices (regular vs discounted) from the Ministry of Trade data.
- resmi_tatiller: public holidays; il_ilce: provinces, plate codes, districts.
- tckn_dogrula / vkn_dogrula / iban_dogrula: offline checksum validation only; they never look anyone up.
Always cite the source/date fields when answering. Unofficial; not affiliated with TCMB, Resmî Gazete, the Ministry of Trade or any public institution.`;

/** Tool groups; each one registers its tools on the server. */
const REGISTRARS: ToolRegistrar[] = [
  registerExchangeRateTool,
  registerResmiGazeteTools,
  registerMarketTool,
  registerHolidayTool,
  registerIlIlceTool,
  registerValidatorTools,
];

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
