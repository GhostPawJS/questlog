import type { QuestlogDb } from '../database.ts';
import { mapQuestlineRow } from './map_questline_row.ts';
import { queryQuestlineStats } from './query_questline_stats.ts';
import type { QuestlineDetail } from './types.ts';

/**
 * Lists active questlines.
 */
export function listQuestlines(db: QuestlogDb, now = Date.now()): QuestlineDetail[] {
	const questlines = db
		.prepare('SELECT * FROM questlines WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC')
		.all()
		.map(mapQuestlineRow);
	if (questlines.length === 0) {
		return [];
	}

	const statsByQuestlineId = queryQuestlineStats(
		db,
		now,
		questlines.map((questline) => questline.id),
	);

	return questlines.map((questline) => {
		const stats = statsByQuestlineId.get(questline.id);
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
	});
}
