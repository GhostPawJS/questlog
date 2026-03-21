import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuestline } from '../questlines/create_questline.ts';
import { createQuest } from '../quests/create_quest.ts';
import { captureRumor } from './capture_rumor.ts';
import { dismissRumor } from './dismiss_rumor.ts';
import { getRumorDetail } from './get_rumor_detail.ts';

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
		strictEqual(detail.markerId, 'attention.available');
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

	it('uses null instead of omitting markerId once a rumor is dismissed', () => {
		const rumor = captureRumor(db, { title: 'Later maybe', now: 1 });
		dismissRumor(db, rumor.id, 5);

		const detail = getRumorDetail(db, rumor.id);
		strictEqual('markerId' in detail, true);
		strictEqual(detail.markerId, null);
	});
});
