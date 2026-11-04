import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dueWithin, selectDue } from './due.ts';
import { addHook } from './hooks/add_hook.ts';
import { tickQuestlog } from './hooks/tick_questlog.ts';
import { initQuestlogTables } from './init_questlog_tables.ts';
import { createInitializedQuestlogDb } from './lib/test-db.ts';
import { createQuest } from './quests/create_quest.ts';
import { createRepeatableQuest } from './repeatable_quests/create_repeatable_quest.ts';
import { spawnDueRepeatableQuests } from './repeatable_quests/spawn_due_repeatable_quests.ts';
import { questlogPlainCommands } from './surface/questlog_plain_commands.ts';
import { dueTool } from './tools/due_tool.ts';

test('due bounds, tags, pagination, independent claims, release and migration', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		initQuestlogTables(db);
		const q = createQuest(db, {
			title: 'late',
			objective: 'late',
			dueAt: 99,
			tags: ['work', 'team'],
			now: 1,
		});
		createQuest(db, { title: 'inside', objective: 'inside', dueAt: 60099, tags: ['work'], now: 1 });
		createQuest(db, { title: 'outside', objective: 'outside', dueAt: 60101, now: 1 });
		createQuest(db, { title: 'no deadline', objective: 'no deadline', now: 1 });
		assert.equal(selectDue(db, {}, 100).items.length, 1);
		assert.equal(selectDue(db, { within: '1m' }, 100).items.length, 2);
		assert.equal(selectDue(db, { within: '1m', tags: ['WORK', 'team'] }, 100).items.length, 1);
		const first = selectDue(db, { within: '1m', limit: 1, claim: 'a' }, 100);
		assert.equal(first.hasMore, true);
		assert.equal(first.items[0]?.overdue, true);
		assert.equal(selectDue(db, { claim: 'a' }, 100).items.length, 0);
		assert.equal(selectDue(db, { claim: 'b' }, 100).items.length, 1);
		assert.equal(selectDue(db, { claim: 'a', release: String(q.id) }, 100).released, true);
		assert.equal(selectDue(db, { claim: 'a' }, 100).items.length, 1);
		assert.equal(selectDue(db, { within: '1m', limit: 1, claim: 'a' }, 100).hasMore, false);
		for (const limit of [0, 1001, 1.5]) assert.throws(() => selectDue(db, { limit }, 100));
		for (const within of ['-1m', 'bad', '1.5h']) assert.throws(() => dueWithin(within));
		assert.equal(dueWithin('7d'), 604800000);
		assert.throws(() => selectDue(db, { release: '1' }, 100));
		assert.throws(() => selectDue(db, { claim: ' ' }, 100));
		assert.equal(dueTool.handler(db, { limit: 1001 }).ok, false);
		assert.equal(dueTool.readOnly, false);
		assert.equal(dueTool.sideEffects, 'writes_state');
	} finally {
		db.close();
	}
});

test('Berlin midnight occurrences cross DST and retain claims after spawning', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const anchorAt = Date.parse('2026-10-23T22:02:00Z');
		const now = Date.parse('2026-10-26T00:00:00Z');
		createRepeatableQuest(db, {
			title: 'midnight',
			objective: 'midnight',
			rrule: 'FREQ=DAILY;COUNT=3',
			anchorAt,
			tz: 'Europe/Berlin',
			tags: ['daily'],
			now: anchorAt,
		});
		const batch = selectDue(db, { claim: 'clock', tags: ['daily'] }, now);
		assert.deepEqual(
			batch.items.map((i) => new Date(i.occurrenceAt as number).toISOString()),
			['2026-10-23T22:02:00.000Z', '2026-10-24T22:02:00.000Z', '2026-10-25T23:02:00.000Z'],
		);
		assert.equal(selectDue(db, { claim: 'clock' }, now).items.length, 0);
		spawnDueRepeatableQuests(db, now);
		assert.equal(selectDue(db, { claim: 'clock' }, now).items.length, 0);
		const last = batch.items[2];
		assert.ok(last);
		selectDue(db, { claim: 'clock', release: last.key }, now);
		assert.equal(selectDue(db, { claim: 'clock' }, now).items.length, 1);
	} finally {
		db.close();
	}
});

test('claim tick emits one full due event per new item through webhook delivery', async () => {
	const db = await createInitializedQuestlogDb();
	const events: Record<string, unknown>[] = [];
	const sender: typeof fetch = async (_url, init) => {
		events.push(...JSON.parse(String(init?.body)).events);
		return new Response(null, { status: 204 });
	};
	try {
		createQuest(db, {
			title: 'due title',
			objective: 'private objective',
			dueAt: 100,
			tags: ['work'],
			now: 1,
		});
		addHook(db, { url: 'https://example.org', events: ['quest.due'], tag: 'work', now: 1 });
		const preview = await tickQuestlog(db, {
			claim: 'worker',
			now: 100,
			dryRun: true,
			fetch: sender,
		});
		assert.equal(preview.dueClaimed, 1);
		assert.equal(events.length, 0);
		const first = await tickQuestlog(db, { claim: 'worker', now: 100, fetch: sender });
		assert.equal(first.dueClaimed, 1);
		assert.equal(events.length, 1);
		assert.equal(events[0]?.consumer, 'worker');
		assert.equal(events[0]?.title, 'due title');
		assert.deepEqual(events[0]?.tags, ['work']);
		assert.equal(
			(await tickQuestlog(db, { claim: 'worker', now: 101, fetch: sender })).dueClaimed,
			0,
		);
		assert.equal(events.length, 1);
	} finally {
		db.close();
	}
});

test('due and tick CLI map additive flags and render one line per item', () => {
	const commands = questlogPlainCommands();
	const due = commands.find((c) => c.spec.command === 'due');
	assert.ok(due);
	assert.deepEqual(
		due.input({ claim: 'a', within: '2h', tag: ['work'], limit: 10, release: '2' }),
		{ claim: 'a', within: '2h', tags: ['work'], limit: 10, release: '2' },
	);
	assert.deepEqual(
		commands.find((c) => c.spec.command === 'tick')?.input({ claim: 'a', within: '1d' }),
		{ action: 'tick', dry_run: false, claim: 'a', within: '1d' },
	);
});

test('effective questline deadline, offsets and resolved/deleted instances', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const { createQuestline } = await import('./questlines/create_questline.ts');
		const line = createQuestline(db, { title: 'line', description: 'line', dueAt: 100, now: 1 });
		const inherited = createQuest(db, {
			title: 'inherited',
			objective: 'inherited',
			questlineId: line.id,
			now: 1,
		});
		const own = createQuest(db, {
			title: 'own',
			objective: 'own',
			questlineId: line.id,
			dueAt: 200,
			now: 1,
		});
		assert.deepEqual(
			selectDue(db, {}, 100).items.map((i) => i.questId),
			[inherited.id],
		);
		db.prepare('UPDATE quests SET deleted_at = 101 WHERE id = ?').run(inherited.id);
		db.prepare(
			"UPDATE quests SET resolved_at = 102, success = 1, outcome = 'done' WHERE id = ?",
		).run(own.id);
		assert.equal(selectDue(db, {}, 300).items.length, 0);
		const r = createRepeatableQuest(db, {
			title: 'offset',
			objective: 'offset',
			rrule: 'FREQ=DAILY;COUNT=1',
			anchorAt: 1000,
			dueOffsetSeconds: 60,
			now: 1,
		});
		assert.equal(selectDue(db, {}, 60999).items.length, 0);
		assert.equal(selectDue(db, {}, 61000).items[0]?.dueAt, 61000);
		const first = selectDue(db, { claim: 'offset' }, 61000);
		initQuestlogTables(db);
		assert.equal(selectDue(db, { claim: 'offset' }, 61000).items.length, 0);
		spawnDueRepeatableQuests(db, 61000);
		assert.equal(selectDue(db, { claim: 'offset' }, 61000).items.length, 0);
		db.prepare(
			"UPDATE quests SET resolved_at = 62000, success = 1, outcome = 'done' WHERE spawned_from_repeatable_id = ?",
		).run(r.id);
		assert.equal(selectDue(db, {}, 63000).items.length, 0);
		assert.equal(first.items.length, 1);
	} finally {
		db.close();
	}
});

test('default batch size is 100; only returned items are claimed', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		for (let i = 0; i < 103; i++)
			createQuest(db, { title: `q${i}`, objective: 'batch', dueAt: 10, now: 1 });
		const first = selectDue(db, { claim: 'batch' }, 10);
		assert.equal(first.items.length, 100);
		assert.equal(first.hasMore, true);
		const second = selectDue(db, { claim: 'batch' }, 10);
		assert.equal(second.items.length, 3);
		assert.equal(second.hasMore, false);
		assert.equal(selectDue(db, { limit: 1000 }, 10).items.length, 103);
	} finally {
		db.close();
	}
});

test('tick within claims a future occurrence once across materialization', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		createRepeatableQuest(db, {
			title: 'future',
			objective: 'future',
			rrule: 'FREQ=DAILY;COUNT=1',
			anchorAt: 60000,
			tags: ['work'],
			now: 1,
		});
		addHook(db, { url: 'https://example.org', events: ['quest.due'], tag: 'work', now: 1 });
		const sent: Record<string, unknown>[] = [];
		const sender: typeof fetch = async (_url, init) => {
			sent.push(...JSON.parse(String(init?.body)).events);
			return new Response(null, { status: 204 });
		};
		assert.equal(
			(await tickQuestlog(db, { claim: 'future', within: '1m', now: 1, fetch: sender })).dueClaimed,
			1,
		);
		assert.equal(sent[0]?.kind, 'occurrence');
		assert.equal(sent[0]?.dueAt, 60000);
		assert.equal(sent[0]?.overdue, false);
		assert.equal(
			(await tickQuestlog(db, { claim: 'future', now: 60000, fetch: sender })).dueClaimed,
			0,
		);
		assert.equal(sent.length, 1);
		assert.equal(
			(await tickQuestlog(db, { claim: 'other', now: 120000, fetch: sender })).dueClaimed,
			1,
		);
		assert.equal(sent.length, 2);
	} finally {
		db.close();
	}
});
