import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuestline } from '../questlines/create_questline';
import { createQuest } from '../quests/create_quest';
import { captureRumor } from './capture_rumor';
import { getRumorDetail } from './get_rumor_detail';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getRumorDetail', () => {
	it('includes derived state and downstream outputs', () => {
		const rumor = captureRumor(db, { title: 'Lead', details: 'd', now: 1 });
		createQuestline(db, { title: 'QL', sourceRumorId: rumor.id, now: 2 });
		createQuest(db, { title: 'Q', objective: 'o', sourceRumorId: rumor.id, now: 3 });
		const detail = getRumorDetail(db, rumor.id);
		strictEqual(detail.outputs.length, 2);
		strictEqual(
			detail.outputs.some((o) => o.entityKind === 'quest'),
			true,
		);
		strictEqual(
			detail.outputs.some((o) => o.entityKind === 'questline'),
			true,
		);
	});
});
