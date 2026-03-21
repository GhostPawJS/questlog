import type { QuestlogDb } from '../database';
import { getQuestlineOrThrow } from './get_questline_or_throw';
import { queryQuestlineStats } from './query_questline_stats';
import type { QuestlineDetail } from './types';

/**
 * Loads a questline with computed progress counts.
 */
export function getQuestlineDetail(
	db: QuestlogDb,
	questlineId: number,
	now = Date.now(),
): QuestlineDetail {
	const questline = getQuestlineOrThrow(db, questlineId);
	const stats = queryQuestlineStats(db, now, [questlineId]).get(questlineId);

	return {
		...questline,
		totalQuests: stats?.totalQuests ?? 0,
		openQuests: stats?.openQuests ?? 0,
		inProgressQuests: stats?.inProgressQuests ?? 0,
		doneQuests: stats?.doneQuests ?? 0,
		abandonedQuests: stats?.abandonedQuests ?? 0,
		availableQuests: stats?.availableQuests ?? 0,
		overdueQuests: stats?.overdueQuests ?? 0,
	};
}
