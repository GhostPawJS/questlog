import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { abandonQuestAndSpawnFollowups } from './abandon_quest_and_spawn_followups';
import { createQuest } from './create_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('abandonQuestAndSpawnFollowups', () => {
	it('abandons a quest and spawns follow-up work with provenance', () => {
		const quest = createQuest(db, {
			title: 'Fix production issue',
			objective: 'Restore service',
			now: 10,
		});

		const result = abandonQuestAndSpawnFollowups(
			db,
			quest.id,
			'Root cause requires schema cleanup first.',
			[
				{
					title: 'Investigate schema drift',
					objective: 'Identify the exact schema mismatch',
				},
				{
					title: 'Apply cleanup migration',
					objective: 'Remove stale records and rerun migration',
				},
			],
			20,
		);

		strictEqual(result.abandonedQuest.success, false);
		strictEqual(result.followupQuests.length, 2);
		deepStrictEqual(
			result.followupQuests.map((followup) => followup.spawnedByQuestId),
			[quest.id, quest.id],
		);
	});
});
