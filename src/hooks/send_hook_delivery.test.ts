import assert from 'node:assert/strict';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { questlogVersion } from '../version.ts';
import { addHook } from './add_hook.ts';
import { listDeliveries } from './list_deliveries.ts';
import { tickQuestlog } from './tick_questlog.ts';

test('HTTP receiver verifies constant-time HMAC and receives one immutable retry batch', async () => {
	const db = await createInitializedQuestlogDb();
	const batches: { id: string; body: string }[] = [];
	const secret = 'receiver-secret';
	const server = createServer(async (request, response) => {
		const chunks: Buffer[] = [];
		for await (const chunk of request) chunks.push(Buffer.from(chunk));
		const body = Buffer.concat(chunks);
		const timestamp = String(request.headers['x-questlog-timestamp']);
		const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest();
		const signature = Buffer.from(String(request.headers['x-questlog-signature']).slice(7), 'hex');
		assert.equal(signature.length, expected.length);
		assert.ok(timingSafeEqual(signature, expected));
		assert.equal(request.headers['user-agent'], `questlog/${questlogVersion}`);
		assert.equal(request.headers['content-type'], 'application/json');
		assert.equal(request.headers.authorization, 'Bearer receiver-key');
		batches.push({ id: String(request.headers['x-questlog-delivery']), body: body.toString() });
		response.writeHead(batches.length === 1 ? 500 : 204).end();
	});
	try {
		await new Promise<void>((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolve);
		});
		const address = server.address();
		assert.ok(address && typeof address !== 'string');
		addHook(db, {
			url: `http://127.0.0.1:${address.port}`,
			secret,
			minGap: 0,
			now: 1,
		});
		db.prepare('UPDATE hook_targets SET headers = ?').run(
			JSON.stringify({ authorization: 'Bearer receiver-key' }),
		);
		createQuest(db, { title: 'PRIVATE_TITLE', objective: 'PRIVATE_OBJECTIVE', dueAt: 2, now: 1 });
		createQuest(db, { title: 'PRIVATE_TITLE', objective: 'PRIVATE_OBJECTIVE', dueAt: 2, now: 1 });
		await tickQuestlog(db, { now: 3 });
		const next = listDeliveries(db)[0];
		assert.ok(next);
		await tickQuestlog(db, { now: next.nextAttemptAt - 1 });
		assert.equal(batches.length, 1);
		await tickQuestlog(db, { now: next.nextAttemptAt });
		assert.equal(batches.length, 2);
		assert.equal(batches[0]?.id, batches[1]?.id);
		assert.deepEqual(
			JSON.parse(batches[0]?.body ?? '').events,
			JSON.parse(batches[1]?.body ?? '').events,
		);
		assert.ok(!batches.some((batch) => batch.body.includes('PRIVATE')));
		assert.equal(listDeliveries(db).length, 0);
	} finally {
		server.closeAllConnections();
		if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
		db.close();
	}
});

test('receiver that never answers times out and queues a retry', async () => {
	const db = await createInitializedQuestlogDb();
	const server = createServer(() => {});
	try {
		await new Promise<void>((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolve);
		});
		const address = server.address();
		assert.ok(address && typeof address !== 'string');
		addHook(db, { url: `http://127.0.0.1:${address.port}`, now: 1 });
		createQuest(db, { title: 'due', objective: 'due', dueAt: 2, now: 1 });
		await tickQuestlog(db, { now: 3, timeoutMs: 20 });
		assert.equal(listDeliveries(db)[0]?.errorClass, 'TimeoutError');
	} finally {
		server.closeAllConnections();
		if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
		db.close();
	}
});

test('injected transport checks signature, abort signal, and sanitizes exception text', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		addHook(db, { url: 'https://example.org', secret: 'secret', now: 1 });
		createQuest(db, { title: 'due', objective: 'due', dueAt: 2, now: 1 });
		await tickQuestlog(db, {
			now: 3,
			fetch: async (_url, init) => {
				const headers = new Headers(init?.headers);
				assert.equal(
					headers.get('x-questlog-signature'),
					`sha256=${createHmac('sha256', 'secret').update(`0.${init?.body}`).digest('hex')}`,
				);
				assert.ok(init?.signal);
				throw new Error('secret private response');
			},
		});
		assert.equal(listDeliveries(db)[0]?.errorClass, 'NetworkError');
		assert.ok(!JSON.stringify(listDeliveries(db)).includes('secret'));
	} finally {
		db.close();
	}
});

test('injected transport observes the timeout signal without a listener', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		addHook(db, { url: 'https://example.org', now: 1 });
		createQuest(db, { title: 'due', objective: 'due', dueAt: 2, now: 1 });
		const keepAlive = setInterval(() => {}, 1000);
		try {
			await tickQuestlog(db, {
				clock: () => 3,
				timeoutMs: 5,
				fetch: async (_url, init) =>
					new Promise((_resolve, reject) => {
						assert.ok(init?.signal);
						init.signal.addEventListener('abort', () => reject(init.signal?.reason), {
							once: true,
						});
					}),
			});
		} finally {
			clearInterval(keepAlive);
		}
		assert.equal(listDeliveries(db)[0]?.errorClass, 'TimeoutError');
		assert.equal(listDeliveries(db)[0]?.lastAttemptAt, 3);
	} finally {
		db.close();
	}
});
