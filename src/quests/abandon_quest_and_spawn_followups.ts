import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { addUnlock } from '../unlocks/add_unlock.ts';
import { withTransaction } from '../with_transaction.ts';
import { abandonQuest } from './abandon_quest.ts';
import { createQuest } from './create_quest.ts';
import type { AbandonQuestResult, FollowupQuestInput } from './types.ts';

/**
 * Abandons a quest and atomically creates follow-up quests that point back to it.
 */
export function abandonQuestAndSpawnFollowups(
	db: QuestlogDb,
	questId: number,
	outcome: string,
	followups: FollowupQuestInput[],
	resolvedAt?: number,
): AbandonQuestResult {
	return withTransaction(db, () => {
		const abandonedQuest = abandonQuest(db, questId, outcome, resolvedAt);
		const now = resolveNow(resolvedAt);
		const followupQuests = followups.map((followup) =>
			createQuest(db, {
				...followup,
				questlineId: followup.questlineId ?? abandonedQuest.questlineId,
				spawnedByQuestId: questId,
				now,
			}),
		);

		for (let i = 0; i < followups.length; i += 1) {
			const followup = followups[i];
			const created = followupQuests[i];
			if (followup?.unlocksParent && created) {
				addUnlock(db, created.id, questId, resolvedAt);
			}
		}

		return { abandonedQuest, followupQuests };
	});
}
