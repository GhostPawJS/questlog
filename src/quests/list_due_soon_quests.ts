import type { QuestlogDb } from '../database';
import { listQuestDetails } from './list_quest_details';
import type { QuestDetail, QuestListFilters } from './types';

/**
 * Lists quests due before the provided horizon.
 */
export function listDueSoonQuests(
	db: QuestlogDb,
	horizonMs: number,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return listQuestDetails(db, filters, now).filter(
		(quest) =>
			quest.resolvedAt == null &&
			quest.effectiveDueAt != null &&
			quest.effectiveDueAt >= now &&
			quest.effectiveDueAt <= now + horizonMs,
	);
}
