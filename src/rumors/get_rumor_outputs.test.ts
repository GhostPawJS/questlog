import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuestline } from '../questlines/create_questline';
import { createQuest } from '../quests/create_quest';
import { captureRumor } from './capture_rumor';
import { getRumorOutputs } from './get_rumor_outputs';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getRumorOutputs', () => {
	it('sorts quests before questlines, then by id', () => {
		const rumor = captureRumor(db, { title: 'R', now: 1 });
		const ql = createQuestline(db, { title: 'L', sourceRumorId: rumor.id, now: 2 });
		const q = createQuest(db, { title: 'Q', objective: 'o', sourceRumorId: rumor.id, now: 3 });
		const out = getRumorOutputs(db, rumor.id);
		strictEqual(out[0]?.entityKind, 'quest');
		strictEqual(out[0]?.entityId, q.id);
		strictEqual(out[1]?.entityKind, 'questline');
		strictEqual(out[1]?.entityId, ql.id);
	});

	it('ignores soft-deleted downstream rows', () => {
		const rumor = captureRumor(db, { title: 'R', now: 1 });
		const q = createQuest(db, { title: 'Q', objective: 'o', sourceRumorId: rumor.id, now: 2 });
		db.prepare('UPDATE quests SET deleted_at = 9 WHERE id = ?').run(q.id);
		strictEqual(getRumorOutputs(db, rumor.id).length, 0);
	});
});
