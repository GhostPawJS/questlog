import { ok } from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { it } from 'node:test';
import { createInitializedQuestlogDb } from './lib/test-db.ts';
import { createQuestline } from './questlines/create_questline.ts';
import { createQuest } from './quests/create_quest.ts';
import { getQuestDetail } from './quests/get_quest_detail.ts';
import { listAvailableQuests } from './quests/list_available_quests.ts';
import { listBlockedQuests } from './quests/list_blocked_quests.ts';
import type { Quest } from './quests/types.ts';
import { searchQuestlog } from './search_questlog.ts';
import { addUnlock } from './unlocks/add_unlock.ts';

it('keeps representative questlog workloads in the millisecond range', async () => {
	const samples: number[] = [];
	// Fresh databases keep each sample equivalent; the best run filters transient contention.
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const db = await createInitializedQuestlogDb();
		try {
			const startedAt = performance.now();
			const questline = createQuestline(db, { title: 'Performance', dueAt: 50_000, now: 1 });
			const quests: Quest[] = [];

			for (let index = 0; index < 200; index += 1) {
				quests.push(
					createQuest(db, {
						questlineId: questline.id,
						title: `Quest ${index}`,
						objective: `Complete task ${index}`,
						dueAt: 10_000 + index,
						tags: [`tag-${index % 5}`, 'perf'],
						now: index + 2,
					}),
				);
			}

			for (let index = 0; index < quests.length - 1; index += 2) {
				const a = quests[index];
				const b = quests[index + 1];
				if (a && b) {
					addUnlock(db, a.id, b.id, 10_000 + index);
				}
			}

			for (const quest of quests) {
				getQuestDetail(db, quest.id, 20_000);
			}

			listAvailableQuests(db, {}, 20_000);
			listBlockedQuests(db, {}, 20_000);
			searchQuestlog(db, 'Quest');

			samples.push(performance.now() - startedAt);
		} finally {
			db.close();
		}
	}

	const elapsedMs = Math.min(...samples);
	ok(
		elapsedMs < 750,
		`Expected best of 3 representative workloads to stay below 750ms, got ${elapsedMs}ms (samples: ${samples.join(', ')}ms)`,
	);
});
