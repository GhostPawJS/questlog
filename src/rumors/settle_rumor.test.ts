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

describe('settleRumor', () => {
	it('settles a rumor into a questline and quests', () => {
		const rumor = captureRumor(db, { title: 'Website redesign', now: 100 });
		const result = settleRumor(db, rumor.id, {
			settledAt: 200,
			questline: { title: 'Website Redesign', now: 200 },
			quests: [
				{ title: 'Rewrite landing page', objective: 'Produce a new landing page', tags: ['web'] },
				{ title: 'Refresh visuals', objective: 'Create new visuals', tags: ['design'] },
			],
		});

		strictEqual(result.rumor.settledAt, 200);
		strictEqual(result.questline?.title, 'Website Redesign');
		strictEqual(result.quests.length, 2);
		deepStrictEqual(
			result.quests.map((quest) => quest.sourceRumorId),
			[rumor.id, rumor.id],
		);
		deepStrictEqual(
			result.quests.map((quest) => quest.questlineId),
			[result.questline?.id, result.questline?.id],
		);

		const detail = getRumorDetail(db, rumor.id);
		strictEqual(detail.state, 'settled');
		deepStrictEqual(
			detail.outputs.map((output) => output.entityKind),
			['quest', 'quest', 'questline'],
		);
	});
});
