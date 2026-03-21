import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { startQuest } from '../quests/start_quest';
import { createQuestline } from './create_questline';
import { queryQuestlineStats } from './query_questline_stats';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('queryQuestlineStats', () => {
	it('returns an empty map when the id list is empty', () => {
		const m = queryQuestlineStats(db, 100, []);
		strictEqual(m.size, 0);
	});

	it('counts lifecycle buckets for quests in the questline', () => {
		const ql = createQuestline(db, { title: 'Arc', now: 1 });
		createQuest(db, { title: 'Open', objective: 'o', questlineId: ql.id, now: 2 });
		const ip = createQuest(db, { title: 'IP', objective: 'o', questlineId: ql.id, now: 3 });
		startQuest(db, ip.id, 4);
		const stats = queryQuestlineStats(db, 50, [ql.id]).get(ql.id);
		strictEqual(stats?.totalQuests, 2);
		strictEqual(stats?.openQuests, 1);
		strictEqual(stats?.inProgressQuests, 1);
	});
});
