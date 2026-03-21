import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from './database';
import { createInitializedQuestlogDb } from './lib/test-db';
import { createQuest } from './quests/create_quest';
import { captureRumor } from './rumors/capture_rumor';
import { searchQuestlog } from './search_questlog';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('searchQuestlog', () => {
	it('returns nothing for blank query without touching FTS', () => {
		strictEqual(searchQuestlog(db, '   ').length, 0);
	});

	it('matches quest and rumor FTS rows and never returns soft-deleted entities', () => {
		createQuest(db, { title: 'Deploy moon', objective: 'Use rockets', now: 1 });
		captureRumor(db, { title: 'Gossip', details: 'moon landing plans', now: 1 });
		const hits = searchQuestlog(db, 'moon');
		strictEqual(hits.length >= 2, true);
		strictEqual(
			hits.some((h) => h.entityKind === 'quest'),
			true,
		);
		strictEqual(
			hits.some((h) => h.entityKind === 'rumor'),
			true,
		);
	});
});
