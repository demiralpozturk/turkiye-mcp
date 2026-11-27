import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VERSION } from '../src/version.js';
import { connectClient } from './helpers.js';

describe('server', () => {
  it('keeps VERSION in sync with package.json', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    expect(VERSION).toBe(pkg.version);
  });

  it('identifies itself and sends instructions', async () => {
    const { client } = await connectClient();
    expect(client.getServerVersion()).toMatchObject({ name: 'turkiye-mcp', version: VERSION });
    expect(client.getInstructions()).toMatch(/Unofficial/);
    await client.close();
  });
});
