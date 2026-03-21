import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from './database.ts';
import { createInitializedQuestlogDb } from './lib/test-db.ts';
import { createQuest } from './quests/create_quest.ts';
import { finishQuest } from './quests/finish_quest.ts';
import { startQuest } from './quests/start_quest.ts';
import { addQuestReward } from './rewards/add_quest_reward.ts';
import { claimQuestReward } from './rewards/claim_quest_reward.ts';
import { captureRumor } from './rumors/capture_rumor.ts';
import { dismissRumor } from './rumors/dismiss_rumor.ts';
import { settleRumor } from './rumors/settle_rumor.ts';
import { searchQuestlog } from './search_questlog.ts';

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
		strictEqual(
			hits.every((hit) => 'markerId' in hit),
			true,
		);
	});

	it('derives exact markers for similarly named quest and rumor hits', () => {
		const now = Date.now();
		const availableQuest = createQuest(db, {
			title: 'Signal available quest',
			objective: 'signal task',
			now,
		});
		const futureQuest = createQuest(db, {
			title: 'Signal future quest',
			objective: 'signal later',
			notBeforeAt: now + 60_000,
			now,
		});
		const prerequisite = createQuest(db, {
			title: 'Signal prerequisite quest',
			objective: 'signal gate',
			now,
		});
		const blockedQuest = createQuest(db, {
			title: 'Signal blocked quest',
			objective: 'signal blocked',
			now,
		});
		db.prepare(
			`INSERT INTO quest_unlocks (from_quest_id, to_quest_id, created_at)
       VALUES (?, ?, ?)`,
		).run(prerequisite.id, blockedQuest.id, now);

		const inProgressQuest = createQuest(db, {
			title: 'Signal in progress quest',
			objective: 'signal moving',
			now,
		});
		startQuest(db, inProgressQuest.id, now + 10);

		const doneQuest = createQuest(db, {
			title: 'Signal done no reward quest',
			objective: 'signal finished',
			now,
		});
		finishQuest(db, doneQuest.id, 'Done', now + 20);

		const doneTurnInQuest = createQuest(db, {
			title: 'Signal done reward quest',
			objective: 'signal reward',
			now,
		});
		addQuestReward(db, doneTurnInQuest.id, {
			kind: 'xp',
			name: 'XP',
			quantity: 5,
			now: now + 21,
		});
		finishQuest(db, doneTurnInQuest.id, 'Done', now + 22);

		const doneClaimedQuest = createQuest(db, {
			title: 'Signal done claimed quest',
			objective: 'signal claimed',
			now,
		});
		const claimedReward = addQuestReward(db, doneClaimedQuest.id, {
			kind: 'xp',
			name: 'XP',
			quantity: 5,
			now: now + 23,
		});
		finishQuest(db, doneClaimedQuest.id, 'Done', now + 24);
		claimQuestReward(db, claimedReward.id, now + 25);

		const openRumor = captureRumor(db, {
			title: 'Signal open rumor',
			details: 'signal gossip',
			now,
		});
		const settledRumor = captureRumor(db, {
			title: 'Signal settled rumor',
			details: 'signal settled',
			now,
		});
		settleRumor(db, settledRumor.id, { settledAt: now + 30 });

		const dismissedRumor = captureRumor(db, {
			title: 'Signal dismissed rumor',
			details: 'signal dismissed',
			now,
		});
		dismissRumor(db, dismissedRumor.id, now + 40);

		const hits = searchQuestlog(db, 'signal');
		const markerByKey = new Map(
			hits.map((hit) => [`${hit.entityKind}:${hit.entityId}`, hit.markerId]),
		);

		strictEqual(markerByKey.get(`quest:${availableQuest.id}`), 'attention.available');
		strictEqual(markerByKey.get(`quest:${futureQuest.id}`), 'attention.available.future');
		strictEqual(markerByKey.get(`quest:${blockedQuest.id}`), 'progress.incomplete');
		strictEqual(markerByKey.get(`quest:${inProgressQuest.id}`), 'progress.incomplete');
		strictEqual(markerByKey.get(`quest:${doneQuest.id}`), null);
		strictEqual(markerByKey.get(`quest:${doneTurnInQuest.id}`), 'progress.complete');
		strictEqual(markerByKey.get(`quest:${doneClaimedQuest.id}`), null);
		strictEqual(markerByKey.get(`rumor:${openRumor.id}`), 'attention.available');
		strictEqual(markerByKey.get(`rumor:${settledRumor.id}`), null);
		strictEqual(markerByKey.get(`rumor:${dismissedRumor.id}`), null);
	});
});
