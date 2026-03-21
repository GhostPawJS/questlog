import type { SQLInputValue } from 'node:sqlite';
import type { QuestlogDb } from '../database.ts';

/**
 * Aggregated questline progress statistics keyed by questline id.
 */
export interface QuestlineStats {
	totalQuests: number;
	openQuests: number;
	inProgressQuests: number;
	doneQuests: number;
	abandonedQuests: number;
	availableQuests: number;
	overdueQuests: number;
}

/**
 * Queries aggregated progress counts for one or more active questlines.
 */
export function queryQuestlineStats(
	db: QuestlogDb,
	now: number,
	questlineIds?: number[],
): Map<number, QuestlineStats> {
	if (questlineIds && questlineIds.length === 0) {
		return new Map();
	}

	const params: SQLInputValue[] = [now, now];
	const questlineFilter =
		questlineIds && questlineIds.length > 0
			? `AND q.questline_id IN (${questlineIds.map(() => '?').join(', ')})`
			: '';

	if (questlineIds && questlineIds.length > 0) {
		params.push(...questlineIds);
	}

	const rows = db
		.prepare(
			`SELECT q.questline_id,
              COUNT(*) AS total_quests,
              SUM(CASE WHEN q.started_at IS NULL AND q.resolved_at IS NULL THEN 1 ELSE 0 END) AS open_quests,
              SUM(CASE WHEN q.started_at IS NOT NULL AND q.resolved_at IS NULL THEN 1 ELSE 0 END) AS in_progress_quests,
              SUM(CASE WHEN q.resolved_at IS NOT NULL AND q.success = 1 THEN 1 ELSE 0 END) AS done_quests,
              SUM(CASE WHEN q.resolved_at IS NOT NULL AND q.success = 0 THEN 1 ELSE 0 END) AS abandoned_quests,
              SUM(
                CASE
                  WHEN q.resolved_at IS NULL
                   AND (q.not_before_at IS NULL OR q.not_before_at <= ?)
                   AND NOT EXISTS (
                     SELECT 1
                     FROM quest_unlocks qu
                     JOIN quests blocker ON blocker.id = qu.from_quest_id
                     WHERE qu.to_quest_id = q.id
                       AND qu.deleted_at IS NULL
                       AND blocker.deleted_at IS NULL
                       AND NOT (blocker.resolved_at IS NOT NULL AND blocker.success = 1)
                   )
                  THEN 1
                  ELSE 0
                END
              ) AS available_quests,
              SUM(
                CASE
                  WHEN q.resolved_at IS NULL
                   AND COALESCE(q.due_at, ql.due_at) IS NOT NULL
                   AND COALESCE(q.due_at, ql.due_at) < ?
                  THEN 1
                  ELSE 0
                END
              ) AS overdue_quests
       FROM quests q
       LEFT JOIN questlines ql ON ql.id = q.questline_id AND ql.deleted_at IS NULL
       WHERE q.deleted_at IS NULL
         AND q.questline_id IS NOT NULL
         ${questlineFilter}
       GROUP BY q.questline_id`,
		)
		.all(...params);

	return new Map(
		rows.map((row) => [
			Number(row.questline_id),
			{
				totalQuests: Number(row.total_quests ?? 0),
				openQuests: Number(row.open_quests ?? 0),
				inProgressQuests: Number(row.in_progress_quests ?? 0),
				doneQuests: Number(row.done_quests ?? 0),
				abandonedQuests: Number(row.abandoned_quests ?? 0),
				availableQuests: Number(row.available_quests ?? 0),
				overdueQuests: Number(row.overdue_quests ?? 0),
			},
		]),
	);
}
