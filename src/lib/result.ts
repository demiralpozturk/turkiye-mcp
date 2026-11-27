import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/** Successful tool result: pretty JSON is easy for both models and humans to read. */
export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/** Tool-level error (reported to the model, not thrown as a protocol error). */
export function errorResult(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}

/** Runs a tool body and converts unexpected exceptions into a readable tool error. */
export async function safely(fn: () => Promise<CallToolResult> | CallToolResult): Promise<CallToolResult> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Hata / Error: ${message}`);
  }
}
