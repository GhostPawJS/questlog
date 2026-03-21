import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { captureRumor } from './capture_rumor.ts';
import { getRumorDetail } from './get_rumor_detail.ts';
import { settleRumor } from './settle_rumor.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('settleRumor settlement shapes', () => {
	it('supports every canonical rumor settlement shape', () => {
		const nothing = captureRumor(db, { title: 'Think about this', now: 10 });
		const nothingResult = settleRumor(db, nothing.id, { settledAt: 20 });
		strictEqual(nothingResult.questline, null);
		strictEqual(nothingResult.quests.length, 0);
		deepStrictEqual(getRumorDetail(db, nothing.id).outputs, []);

		const questlineOnly = captureRumor(db, { title: 'Summer plan', now: 30 });
		const questlineOnlyResult = settleRumor(db, questlineOnly.id, {
			settledAt: 40,
			questline: { title: 'Summer Plan' },
		});
		strictEqual(questlineOnlyResult.questline?.title, 'Summer Plan');
		strictEqual(questlineOnlyResult.quests.length, 0);
		deepStrictEqual(
			getRumorDetail(db, questlineOnly.id).outputs.map((output) => output.entityKind),
			['questline'],
		);

		const questsOnly = captureRumor(db, { title: 'Errands', now: 50 });
		const questsOnlyResult = settleRumor(db, questsOnly.id, {
			settledAt: 60,
			quests: [
				{ title: 'Mail package', objective: 'Bring the package to the post office' },
				{ title: 'Buy tape', objective: 'Pick up packing tape' },
			],
		});
		strictEqual(questsOnlyResult.questline, null);
		strictEqual(questsOnlyResult.quests.length, 2);
		deepStrictEqual(
			getRumorDetail(db, questsOnly.id).outputs.map((output) => output.entityKind),
			['quest', 'quest'],
		);
	});
});
