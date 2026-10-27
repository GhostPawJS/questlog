import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuestline } from '../questlines/create_questline.ts';
import { createQuest } from '../quests/create_quest.ts';
import { finishQuest } from '../quests/finish_quest.ts';
import { createRepeatableQuest } from '../repeatable_quests/create_repeatable_quest.ts';
import { captureRumor } from '../rumors/capture_rumor.ts';
import { addUnlock } from '../unlocks/add_unlock.ts';
import { detectHookEvents } from './detect_hook_events.ts';
import { tickQuestlog } from './tick_questlog.ts';

test('effective deadlines, prerequisite success, rumors, and materialized repeatables follow the model', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const line = createQuestline(db, { title: 'line', dueAt: 10, now: 1 });
		const q = createQuest(db, { title: 'child', objective: 'child', questlineId: line.id, now: 1 });
		const gate = createQuest(db, { title: 'gate', objective: 'gate', now: 1 });
		addUnlock(db, gate.id, q.id, 2);
		assert.ok(!detectHookEvents(db, 10).some((e) => e.type === 'quest.unblocked'));
		assert.ok(detectHookEvents(db, 10).some((e) => e.type === 'quest.due' && e.questId === q.id));
		assert.ok(!detectHookEvents(db, 10).some((e) => e.type === 'quest.overdue'));
		finishQuest(db, gate.id, 'done', 11);
		captureRumor(db, { title: 'rumor', now: 12 });
		const repeatable = createRepeatableQuest(db, {
			title: 'daily',
			objective: 'daily',
			rrule: 'FREQ=DAILY',
			anchorAt: 12,
			now: 1,
		});
		const preview = await tickQuestlog(db, { now: 12, dryRun: true });
		assert.ok(
			preview.events.some(
				(e) => e.type === 'repeatable.spawned' && e.repeatableId === repeatable.id,
			),
		);
		assert.equal(
			db
				.prepare('SELECT COUNT(*) AS n FROM quests WHERE spawned_from_repeatable_id IS NOT NULL')
				.get()?.n,
			0,
		);
		const events = (await tickQuestlog(db, { now: 12 })).events;
		for (const type of [
			'quest.due',
			'quest.overdue',
			'quest.unblocked',
			'repeatable.spawned',
			'rumor.captured',
		])
			assert.ok(
				events.some((e) => e.type === type),
				type,
			);
		assert.equal((await tickQuestlog(db, { now: 12 })).events.length, 0);
	} finally {
		db.close();
	}
});
