import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { initQuestlogTables } from '../init_questlog_tables.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { captureRumor } from '../rumors/capture_rumor.ts';
import { renderQuestlogPlainResult } from '../surface/render_questlog_plain_result.ts';
import { tagQuest } from '../tags/tag_quest.ts';
import { inspectQuestlogItemToolHandler } from '../tools/inspect_questlog_item_tool.ts';
import { reviewQuestlogToolHandler } from '../tools/review_questlog_tool.ts';
import { addHook } from './add_hook.ts';
import { listDeliveries } from './list_deliveries.ts';
import { listHooks } from './list_hooks.ts';
import { tickQuestlog } from './tick_questlog.ts';

let forbiddenCalls = 0;
const forbiddenFetch: typeof fetch = async () => {
	forbiddenCalls++;
	throw new Error('Unexpected network call');
};
test('no targets and dry runs never call fetch; previews record nothing', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		createQuest(db, { title: 'private title', objective: 'private objective', dueAt: 100, now: 1 });
		assert.equal((await tickQuestlog(db, { now: 100, fetch: forbiddenFetch })).sent, 0);
		addHook(db, { url: 'https://example.org', now: 1 });
		const before = db.prepare('SELECT * FROM hook_events').all();
		const preview = await tickQuestlog(db, { now: 101, dryRun: true, fetch: forbiddenFetch });
		assert.equal(preview.batches.length, 1);
		assert.deepEqual(db.prepare('SELECT * FROM hook_events').all(), before);
		assert.equal(listDeliveries(db).length, 0);
		assert.equal(db.prepare('SELECT COUNT(*) AS n FROM hook_assignments').get()?.n, 0);
		assert.equal(forbiddenCalls, 0);
	} finally {
		db.close();
	}
});

test('batches, min gap, filters, no backlog, and private payloads', async () => {
	const db = await createInitializedQuestlogDb();
	const bodies: string[] = [];
	const sender: typeof fetch = async (_url, init) => {
		bodies.push(String(init?.body));
		return new Response(null, { status: 204 });
	};
	try {
		const old = createQuest(db, {
			title: 'SENTINEL_TITLE',
			objective: 'SENTINEL_OBJECTIVE',
			dueAt: 1,
			now: 0,
		});
		const target = addHook(db, {
			url: 'https://example.org',
			tag: 'work',
			events: ['quest.due'],
			now: 10,
		});
		tagQuest(db, old.id, ['work'], 10);
		const q = createQuest(db, {
			title: 'SENTINEL_TITLE',
			objective: 'SENTINEL_OBJECTIVE',
			dueAt: 20,
			now: 10,
		});
		tagQuest(db, q.id, ['work'], 10);
		createQuest(db, { title: 'untagged', objective: 'untagged', dueAt: 20, now: 10 });
		captureRumor(db, { title: 'SENTINEL_RUMOR', details: 'SENTINEL_DETAILS', now: 20 });
		await tickQuestlog(db, { now: 20, fetch: sender });
		assert.equal(bodies.length, 1);
		assert.deepEqual(
			JSON.parse(bodies[0] ?? '').events.map((e: { questId: number }) => e.questId),
			[q.id],
		);
		for (let i = 0; i < 3; i++) {
			const next = createQuest(db, {
				title: 'SENTINEL_TITLE',
				objective: 'SENTINEL_OBJECTIVE',
				dueAt: 30,
				now: 21,
			});
			tagQuest(db, next.id, ['work'], 21);
		}
		await tickQuestlog(db, { now: 30, fetch: sender });
		assert.equal(bodies.length, 1);
		assert.equal(listHooks(db)[0]?.pending, 3);
		await tickQuestlog(db, { now: 60020, fetch: sender });
		assert.equal(bodies.length, 2);
		assert.equal(JSON.parse(bodies[1] ?? '').events.length, 3);
		assert.ok(!bodies.join('').includes('SENTINEL'));
		assert.equal(listHooks(db)[0]?.id, target.id);
	} finally {
		db.close();
	}
});

test('persistent events and assignments survive file database restarts', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-hooks-'));
	let db = new DatabaseSync(join(dir, 'work.db'));
	let sends = 0;
	const sender: typeof fetch = async () => {
		sends++;
		return new Response(null, { status: 204 });
	};
	try {
		initQuestlogTables(db);
		addHook(db, { url: 'https://example.org', now: 1, minGap: 0 });
		createQuest(db, { title: 'due', objective: 'due', dueAt: 10, now: 1 });
		await tickQuestlog(db, { now: 11, fetch: sender });
		db.close();
		db = new DatabaseSync(join(dir, 'work.db'));
		initQuestlogTables(db);
		assert.equal((await tickQuestlog(db, { now: 12, fetch: sender })).events.length, 0);
		assert.equal(sends, 1);
	} finally {
		db.close();
		rmSync(dir, { recursive: true });
	}
});

test('retry schedule preserves delivery id and events, eight failures appear in inspect and review without secrets', async () => {
	const db = await createInitializedQuestlogDb();
	const ids: string[] = [];
	let status = 500;
	const sender: typeof fetch = async (_url, init) => {
		ids.push(new Headers(init?.headers).get('x-questlog-delivery') ?? '');
		return new Response(null, { status });
	};
	try {
		const secret = 'SECRET_SENTINEL';
		addHook(db, {
			url: 'https://user:password@example.org/path?secret=hidden',
			secret,
			minGap: 0,
			now: 1,
		});
		const q = createQuest(db, { title: 'due', objective: 'due', dueAt: 10, now: 1 });
		await tickQuestlog(db, { now: 11, fetch: sender });
		let delivery = listDeliveries(db)[0];
		assert.ok(delivery);
		assert.ok(delivery.nextAttemptAt >= 30011 && delivery.nextAttemptAt < 31011);
		await tickQuestlog(db, { now: delivery.nextAttemptAt - 1, fetch: sender });
		assert.equal(ids.length, 1);
		status = 200;
		await tickQuestlog(db, { now: delivery.nextAttemptAt, fetch: sender });
		assert.equal(ids[0], ids[1]);
		assert.equal(listDeliveries(db).length, 0);
		createQuest(db, { title: 'failure', objective: 'failure', dueAt: 40000, now: 12 });
		status = 500;
		await tickQuestlog(db, { now: 40001, fetch: sender });
		for (let attempt = 1; attempt < 8; attempt++) {
			delivery = listDeliveries(db)[0];
			assert.ok(delivery);
			await tickQuestlog(db, { now: delivery.nextAttemptAt, fetch: sender });
		}
		assert.equal(listDeliveries(db)[0]?.status, 'failed');
		const failedQuest = listDeliveries(db)[0]?.events[0]?.questId;
		assert.ok(failedQuest);
		const inspect = inspectQuestlogItemToolHandler(db, {
			target: { kind: 'quest', id: failedQuest },
		});
		const review = reviewQuestlogToolHandler(db, { view: 'deliveries' });
		assert.match(JSON.stringify(inspect), /failed/);
		assert.match(renderQuestlogPlainResult(inspect, db, {}), /failed/);
		assert.match(renderQuestlogPlainResult(review, db, {}), /failed/);
		assert.match(JSON.stringify(review), /failed/);
		const outputs = JSON.stringify([
			listHooks(db),
			listDeliveries(db),
			inspect,
			review,
			await tickQuestlog(db, { now: 40002, dryRun: true }),
			inspectQuestlogItemToolHandler(db, { target: { kind: 'quest', id: q.id } }),
		]);
		for (const value of [secret, 'password', 'hidden']) assert.ok(!outputs.includes(value));
	} finally {
		db.close();
	}
});

test('overlapping ticks cannot send the same claim; expired lease recovers the same id', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-claims-'));
	const db = new DatabaseSync(join(dir, 'claims.db'));
	initQuestlogTables(db);
	const other = new DatabaseSync(join(dir, 'claims.db'));
	initQuestlogTables(other);
	try {
		addHook(db, { url: 'https://example.org', now: 1, minGap: 0 });
		createQuest(db, { title: 'due', objective: 'due', dueAt: 10, now: 1 });
		let finish: (response: Response) => void = () => {};
		let sends = 0;
		const first = tickQuestlog(db, {
			now: 11,
			fetch: async () => {
				sends++;
				return new Promise((resolve) => {
					finish = resolve;
				});
			},
		});
		await tickQuestlog(other, {
			now: 12,
			fetch: async () => {
				sends++;
				throw new Error('duplicate');
			},
		});
		assert.equal(sends, 1);
		const id = listDeliveries(db)[0]?.id;
		await tickQuestlog(other, {
			now: 120012,
			fetch: async (_url, init) => {
				assert.equal(new Headers(init?.headers).get('x-questlog-delivery'), id);
				return new Response(null, { status: 204 });
			},
		});
		finish(new Response(null, { status: 500 }));
		await first;
		assert.equal(listDeliveries(db, { includeDelivered: true })[0]?.status, 'delivered');
	} finally {
		other.close();
		db.close();
		rmSync(dir, { recursive: true });
	}
});

test('rumors reach database scope only, including when tag targets subscribe to rumors', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const database = addHook(db, {
			url: 'https://example.org/database',
			events: ['rumor.captured'],
			now: 1,
		});
		addHook(db, {
			url: 'https://example.org/tag',
			tag: 'work',
			events: ['rumor.captured'],
			now: 1,
		});
		captureRumor(db, { title: 'private rumor', details: 'private details', now: 2 });
		const urls: string[] = [];
		const result = await tickQuestlog(db, {
			now: 2,
			fetch: async (url) => {
				urls.push(String(url));
				return new Response(null, { status: 204 });
			},
		});
		assert.deepEqual(urls, ['https://example.org/database']);
		assert.equal(result.batches[0]?.targetId, database.id);
	} finally {
		db.close();
	}
});
