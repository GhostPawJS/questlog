import { ok } from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { it } from 'node:test';
import { createInitializedQuestlogDb } from './lib/test-db';
import { createQuestline } from './questlines/create_questline';
import { createQuest } from './quests/create_quest';
import { getQuestDetail } from './quests/get_quest_detail';
import { listAvailableQuests } from './quests/list_available_quests';
import { listBlockedQuests } from './quests/list_blocked_quests';
import type { Quest } from './quests/types';
import { searchQuestlog } from './search_questlog';
import { addUnlock } from './unlocks/add_unlock';

it('keeps representative questlog workloads in the millisecond range', async () => {
	const db = await createInitializedQuestlogDb();

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

	const elapsedMs = performance.now() - startedAt;
	ok(elapsedMs < 750, `Expected representative workload to stay below 750ms, got ${elapsedMs}ms`);
});
