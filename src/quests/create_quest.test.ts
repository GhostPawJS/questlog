import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('createQuest', () => {
	it('creates a quest with tags and rewards', () => {
		const quest = createQuest(db, {
			title: 'Push release',
			objective: 'Deploy the release candidate',
			tags: ['release', 'ops'],
			rewards: [{ kind: 'xp', name: 'XP', quantity: 120 }],
			dueAt: 500,
			now: 10,
		});

		strictEqual(quest.title, 'Push release');
		strictEqual(quest.dueAt, 500);
		const tagRows = db
			.prepare('SELECT COUNT(*) AS total FROM quest_tags WHERE quest_id = ? AND deleted_at IS NULL')
			.get(quest.id);
		strictEqual(Number(tagRows?.total ?? 0), 2);
		const rewardRows = db
			.prepare(
				'SELECT COUNT(*) AS total FROM quest_rewards WHERE quest_id = ? AND deleted_at IS NULL',
			)
			.get(quest.id);
		strictEqual(Number(rewardRows?.total ?? 0), 1);
	});
});
