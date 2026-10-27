import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addHook } from '../hooks/add_hook.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { manageHooksTool } from './manage_hooks_tool.ts';

test('async management returns standard results and never exposes secrets', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const { id, secret } = addHook(db, { url: 'https://example.org' });
		for (const action of ['list', 'deliveries', 'tick'] as const) {
			const result = await manageHooksTool.handler(db, { action, dry_run: true });
			assert.equal(result.ok, true);
			assert.ok(!JSON.stringify(result).includes(secret));
		}
		assert.equal((await manageHooksTool.handler(db, { action: 'remove' })).ok, false);
		assert.equal((await manageHooksTool.handler(db, { action: 'remove', id })).ok, true);
	} finally {
		db.close();
	}
});

test('MCP awaits async webhook ticks and returns structured results', async () => {
	const { createMcpServer } = await import('../surfaces/mcp_server.ts');
	const { questlogSurfaceTools } = await import('../surface/questlog_surface_tools.ts');
	const db = await createInitializedQuestlogDb();
	try {
		const server = createMcpServer({
			name: 'questlog',
			version: '1',
			tools: questlogSurfaceTools,
			context: () => db,
		});
		const response = await server.handleLine(
			JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'tools/call',
				params: {
					_meta: {
						'io.modelcontextprotocol/protocolVersion': '2026-07-28',
						'io.modelcontextprotocol/clientCapabilities': {},
					},
					name: 'manage_hooks',
					arguments: { action: 'tick', dry_run: true },
				},
			}),
		);
		assert.ok(response);
		const result = JSON.parse(response).result;
		assert.equal(result.isError, false);
		assert.match(result.content[0].text, /Webhook tick completed/);
	} finally {
		db.close();
	}
});
