import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { addQuestReward } from '../rewards/add_quest_reward';
import { claimQuestReward } from '../rewards/claim_quest_reward';
import { createQuest } from './create_quest';
import { finishQuest } from './finish_quest';
import { getQuestDetail } from './get_quest_detail';
import { listQuestDetails } from './list_quest_details';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listQuestDetails', () => {
	it('returns one detail per active quest by default', () => {
		createQuest(db, { title: 'One', objective: 'a', now: 1 });
		createQuest(db, { title: 'Two', objective: 'b', now: 2 });
		const rows = listQuestDetails(db, {}, 10);
		strictEqual(rows.length, 2);
		strictEqual(
			rows.every((row) => 'markerId' in row),
			true,
		);
	});

	it('respects tag filters when provided', () => {
		createQuest(db, {
			title: 'Tagged',
			objective: 'x',
			tags: ['alpha'],
			now: 1,
		});
		createQuest(db, { title: 'Other', objective: 'y', tags: ['beta'], now: 2 });
		const rows = listQuestDetails(db, { tagNames: ['alpha'] }, 10);
		strictEqual(rows.length, 1);
		strictEqual(rows[0]?.title, 'Tagged');
	});

	it('keeps marker ids identical between list and detail reads', () => {
		const quest = createQuest(db, {
			title: 'Later',
			objective: 'defer it',
			notBeforeAt: 500,
			now: 100,
		});

		const [listed] = listQuestDetails(db, {}, 200);
		const detailed = getQuestDetail(db, quest.id, 200);

		strictEqual(listed?.markerId, 'attention.available.future');
		strictEqual(listed?.markerId, detailed.markerId);
	});

	it('keeps turn-in pending markers identical between list and detail reads', () => {
		const quest = createQuest(db, {
			title: 'Turn in later',
			objective: 'Claim the thing',
			now: 1,
		});
		const reward = addQuestReward(db, quest.id, { kind: 'xp', name: 'XP', quantity: 5, now: 2 });
		finishQuest(db, quest.id, 'Done', 3);

		const [listedBeforeClaim] = listQuestDetails(db, {}, 10);
		const detailedBeforeClaim = getQuestDetail(db, quest.id, 10);
		strictEqual(listedBeforeClaim?.markerId, 'progress.complete');
		strictEqual(listedBeforeClaim?.markerId, detailedBeforeClaim.markerId);

		claimQuestReward(db, reward.id, 4);

		const [listedAfterClaim] = listQuestDetails(db, {}, 10);
		const detailedAfterClaim = getQuestDetail(db, quest.id, 10);
		strictEqual(listedAfterClaim?.markerId, null);
		strictEqual(listedAfterClaim?.markerId, detailedAfterClaim.markerId);
	});
});
