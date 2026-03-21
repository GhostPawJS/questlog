import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { addQuestReward } from '../rewards/add_quest_reward.ts';
import { claimQuestReward } from '../rewards/claim_quest_reward.ts';
import { createQuest } from './create_quest.ts';
import { finishQuest } from './finish_quest.ts';
import { queryQuestDetailRecords } from './query_quest_detail_records.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('queryQuestDetailRecords', () => {
	it('returns blockerCount alongside detail for dependency-aware UIs', () => {
		const a = createQuest(db, { title: 'A', objective: 'a', now: 1 });
		const b = createQuest(db, { title: 'B', objective: 'b', now: 1 });
		db.prepare(
			`INSERT INTO quest_unlocks (from_quest_id, to_quest_id, created_at)
       VALUES (?, ?, 1)`,
		).run(a.id, b.id);
		const records = queryQuestDetailRecords(db, {}, 10, [b.id]);
		strictEqual(records.length, 1);
		const record = records[0];
		strictEqual(record?.blockerCount != null && record.blockerCount >= 1, true);
		strictEqual(record?.detail.id, b.id);
		strictEqual(record?.detail.markerId, 'progress.incomplete');
	});

	it('returns empty when questIds filter is an empty array (explicit no-op)', () => {
		createQuest(db, { title: 'X', objective: 'y', now: 1 });
		strictEqual(queryQuestDetailRecords(db, {}, 10, []).length, 0);
	});

	it('marks deferred quests with the future attention marker', () => {
		const quest = createQuest(db, {
			title: 'Later',
			objective: 'Not yet',
			notBeforeAt: 500,
			now: 100,
		});

		const [record] = queryQuestDetailRecords(db, {}, 200, [quest.id]);
		strictEqual(record?.detail.available, false);
		strictEqual(record?.detail.markerId, 'attention.available.future');
	});

	it('prefers the future attention marker over blocked progress when both conditions apply', () => {
		const prerequisite = createQuest(db, { title: 'Gate', objective: 'unlock it', now: 1 });
		const gated = createQuest(db, {
			title: 'Later gated',
			objective: 'wait and unlock',
			notBeforeAt: 500,
			now: 100,
		});
		db.prepare(
			`INSERT INTO quest_unlocks (from_quest_id, to_quest_id, created_at)
       VALUES (?, ?, 1)`,
		).run(prerequisite.id, gated.id);

		const [record] = queryQuestDetailRecords(db, {}, 200, [gated.id]);
		strictEqual(record?.blockerCount, 1);
		strictEqual(record?.detail.markerId, 'attention.available.future');
	});

	it('marks done quests with no active rewards as having no turn-in marker', () => {
		const quest = createQuest(db, { title: 'Done no reward', objective: 'finish it', now: 1 });
		finishQuest(db, quest.id, 'Done', 2);

		const [record] = queryQuestDetailRecords(db, {}, 10, [quest.id]);
		strictEqual(record?.detail.markerId, null);
	});

	it('marks done quests with an unclaimed reward as turn-in pending', () => {
		const quest = createQuest(db, { title: 'Done reward', objective: 'finish it', now: 1 });
		addQuestReward(db, quest.id, { kind: 'xp', name: 'XP', quantity: 5, now: 2 });
		finishQuest(db, quest.id, 'Done', 3);

		const [record] = queryQuestDetailRecords(db, {}, 10, [quest.id]);
		strictEqual(record?.detail.markerId, 'progress.complete');
	});

	it('clears the turn-in marker after the last reward is claimed', () => {
		const quest = createQuest(db, { title: 'Claimed reward', objective: 'finish it', now: 1 });
		const reward = addQuestReward(db, quest.id, { kind: 'xp', name: 'XP', quantity: 5, now: 2 });
		finishQuest(db, quest.id, 'Done', 3);
		claimQuestReward(db, reward.id, 4);

		const [record] = queryQuestDetailRecords(db, {}, 10, [quest.id]);
		strictEqual(record?.detail.markerId, null);
	});
});
