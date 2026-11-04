import { deepStrictEqual, strictEqual, throws } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { manageRepeatableToolHandler } from '../tools/manage_repeatable_tool.ts';
import { createRepeatableQuest } from './create_repeatable_quest.ts';
import { generateAnchorsUntil } from './generate_anchors_until.ts';
import { initRepeatableQuestTables } from './init_repeatable_quest_tables.ts';
import { updateRepeatableQuest } from './update_repeatable_quest.ts';

test('zoned daily anchors retain 00:02 across both 2026 Berlin DST transitions', async () => {
	const db = await createInitializedQuestlogDb();
	for (const [start, expected] of [
		[
			'2026-03-27T23:02Z',
			['2026-03-27T23:02Z', '2026-03-28T23:02Z', '2026-03-29T22:02Z', '2026-03-30T22:02Z'],
		],
		[
			'2026-10-23T22:02Z',
			['2026-10-23T22:02Z', '2026-10-24T22:02Z', '2026-10-25T23:02Z', '2026-10-26T23:02Z'],
		],
	] as const) {
		const quest = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'Work',
			rrule: 'FREQ=DAILY;COUNT=4',
			anchorAt: Date.parse(start),
			tz: 'Europe/Berlin',
		});
		deepStrictEqual(
			generateAnchorsUntil(quest, Date.parse('2026-11-01')),
			expected.map(Date.parse),
		);
		const cleared = updateRepeatableQuest(db, quest.id, { tz: null });
		deepStrictEqual(
			generateAnchorsUntil(cleared, Date.parse('2026-11-01')),
			[0, 1, 2, 3].map((day) => quest.anchorAt + day * 86400000),
		);
		strictEqual(updateRepeatableQuest(db, quest.id, { title: 'New' }).tz, null);
		const revised = manageRepeatableToolHandler(db, {
			action: 'revise',
			repeatableQuestId: quest.id,
			tz: 'Europe/Berlin',
		});
		strictEqual(revised.ok && revised.data.repeatableQuest?.tz, 'Europe/Berlin');
		strictEqual(
			manageRepeatableToolHandler(db, { action: 'update', repeatableQuestId: quest.id, tz: null })
				.ok,
			true,
		);
		throws(() => updateRepeatableQuest(db, quest.id, { tz: 'Bad/Zone' }), /Invalid time zone/);
	}
});

test('existing repeatables receive NULL tz through idempotent migration', () => {
	const db = new DatabaseSync(':memory:');
	db.exec('CREATE TABLE questlines(id INTEGER PRIMARY KEY)');
	initRepeatableQuestTables(db);
	db.exec(
		"ALTER TABLE repeatable_quests DROP COLUMN tz; INSERT INTO repeatable_quests(title,objective,rrule,anchor_at,created_at,updated_at) VALUES ('old','work','FREQ=DAILY',0,0,0)",
	);
	initRepeatableQuestTables(db);
	initRepeatableQuestTables(db);
	strictEqual(db.prepare('SELECT tz FROM repeatable_quests').get()?.tz, null);
	db.close();
});

test('zoned weekly, monthly and yearly rules use local calendar fields and absolute UNTIL', async () => {
	const db = await createInitializedQuestlogDb();
	for (const [rrule, expected] of [
		['FREQ=WEEKLY;BYDAY=MO;COUNT=2', ['2026-03-22T23:02Z', '2026-03-29T22:02Z']],
		['FREQ=MONTHLY;COUNT=2', ['2026-03-22T23:02Z', '2026-04-22T22:02Z']],
		['FREQ=YEARLY;COUNT=2', ['2026-03-22T23:02Z', '2027-03-22T23:02Z']],
	] as const) {
		const quest = createRepeatableQuest(db, {
			title: 'Calendar',
			objective: 'Work',
			anchorAt: Date.parse('2026-03-22T23:02Z'),
			rrule,
			tz: 'Europe/Berlin',
		});
		deepStrictEqual(
			generateAnchorsUntil(quest, Date.parse('2028-01-01')),
			expected.map(Date.parse),
		);
	}
	const quest = createRepeatableQuest(db, {
		title: 'Until',
		objective: 'Work',
		anchorAt: Date.parse('2026-03-28T23:02Z'),
		rrule: 'UNTIL=2026-03-29T22:02:00Z;FREQ=DAILY',
		tz: 'Europe/Berlin',
	});
	deepStrictEqual(
		generateAnchorsUntil(quest, Date.parse('2026-04-01')),
		['2026-03-28T23:02Z', '2026-03-29T22:02Z'].map(Date.parse),
	);
});
