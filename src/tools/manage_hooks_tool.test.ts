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

test('removing an unknown or already removed hook returns a not-found error', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const { id } = addHook(db, { url: 'https://example.org' });
		assert.equal((await manageHooksTool.handler(db, { action: 'remove', id })).ok, true);
		for (const missingId of [999, id]) {
			const result = await manageHooksTool.handler(db, { action: 'remove', id: missingId });
			assert.equal(result.ok, false);
			assert.equal(result.outcome, 'error');
			if (result.outcome !== 'error') assert.fail('Expected a tool error');
			assert.equal(result.error.kind, 'domain');
			assert.equal(result.error.code, 'not_found');
			assert.equal(result.error.message, `Hook ${missingId} not found`);
			assert.deepEqual(result.entities, []);
			assert.ok(!('data' in result));
		}
	} finally {
		db.close();
	}
});
