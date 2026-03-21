import type { SQLInputValue } from 'node:sqlite';
import type { QuestlogDb } from '../database.ts';
import { deriveQuestMarkerId } from '../markers/derive_quest_marker_id.ts';
import { mapQuestRewardRow } from '../rewards/map_quest_reward_row.ts';
import type { QuestReward } from '../rewards/types.ts';
import { normalizeTagName } from '../tags/normalize_tag_name.ts';
import { deriveQuestState } from './derive_quest_state.ts';
import { mapQuestRow } from './map_quest_row.ts';
import type { QuestDetail, QuestListFilters } from './types.ts';

/**
 * An internal quest detail record with computed blocker metadata for list-style reads.
 */
export interface QuestDetailRecord {
	detail: QuestDetail;
	blockerCount: number;
}

/**
 * Queries quest details with batched relation loading instead of per-row fanout.
 */
export function queryQuestDetailRecords(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
	questIds?: number[],
): QuestDetailRecord[] {
	if (questIds && questIds.length === 0) {
		return [];
	}

	const clauses: string[] = [];
	const params: SQLInputValue[] = [];

	if (!filters.includeDeleted) {
		clauses.push('q.deleted_at IS NULL');
	}
	if (questIds && questIds.length > 0) {
		clauses.push(`q.id IN (${questIds.map(() => '?').join(', ')})`);
		params.push(...questIds);
	}
	if (filters.questlineId != null) {
		clauses.push('q.questline_id = ?');
		params.push(filters.questlineId);
	}
	if (filters.tagNames && filters.tagNames.length > 0) {
		const normalized = [...new Set(filters.tagNames.map(normalizeTagName).filter(Boolean))];
		for (const tag of normalized) {
			clauses.push(
				`EXISTS (
           SELECT 1
           FROM quest_tags qt
           JOIN tags t ON t.id = qt.tag_id
           WHERE qt.quest_id = q.id
             AND qt.deleted_at IS NULL
             AND t.deleted_at IS NULL
             AND t.normalized_name = ?
         )`,
			);
			params.push(tag);
		}
	}

	const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
	const rows = db
		.prepare(
			`SELECT q.*,
              COALESCE(q.due_at, ql.due_at) AS effective_due_at,
              (
                SELECT COUNT(*)
                FROM quest_unlocks qu
                JOIN quests blocker ON blocker.id = qu.from_quest_id
                WHERE qu.to_quest_id = q.id
                  AND qu.deleted_at IS NULL
                  AND blocker.deleted_at IS NULL
                  AND NOT (blocker.resolved_at IS NOT NULL AND blocker.success = 1)
              ) AS blocker_count
       FROM quests q
       LEFT JOIN questlines ql ON ql.id = q.questline_id AND ql.deleted_at IS NULL
       ${where}
       ORDER BY q.created_at DESC, q.id DESC`,
		)
		.all(...params);

	if (rows.length === 0) {
		return [];
	}

	const ids = rows.map((row) => Number(row.id));
	const placeholders = ids.map(() => '?').join(', ');
	const tagNamesByQuestId = new Map<number, string[]>();
	const rewardsByQuestId = new Map<number, QuestReward[]>();
	const unlocksByQuestId = new Map<number, number[]>();
	const unlockedByQuestId = new Map<number, number[]>();

	for (const row of db
		.prepare(
			`SELECT qt.quest_id, t.name
       FROM quest_tags qt
       JOIN tags t ON t.id = qt.tag_id
       WHERE qt.quest_id IN (${placeholders})
         AND qt.deleted_at IS NULL
         AND t.deleted_at IS NULL
       ORDER BY qt.quest_id, t.name`,
		)
		.all(...ids)) {
		const questId = Number(row.quest_id);
		const tagNames = tagNamesByQuestId.get(questId) ?? [];
		tagNames.push(String(row.name));
		tagNamesByQuestId.set(questId, tagNames);
	}

	for (const row of db
		.prepare(
			`SELECT *
       FROM quest_rewards
       WHERE quest_id IN (${placeholders})
         AND deleted_at IS NULL
       ORDER BY quest_id, created_at, id`,
		)
		.all(...ids)) {
		const reward = mapQuestRewardRow(row);
		const rewards = rewardsByQuestId.get(reward.questId) ?? [];
		rewards.push(reward);
		rewardsByQuestId.set(reward.questId, rewards);
	}

	for (const row of db
		.prepare(
			`SELECT from_quest_id, to_quest_id
       FROM quest_unlocks
       WHERE from_quest_id IN (${placeholders})
         AND deleted_at IS NULL
       ORDER BY from_quest_id, to_quest_id`,
		)
		.all(...ids)) {
		const questId = Number(row.from_quest_id);
		const unlocks = unlocksByQuestId.get(questId) ?? [];
		unlocks.push(Number(row.to_quest_id));
		unlocksByQuestId.set(questId, unlocks);
	}

	for (const row of db
		.prepare(
			`SELECT from_quest_id, to_quest_id
       FROM quest_unlocks
       WHERE to_quest_id IN (${placeholders})
         AND deleted_at IS NULL
       ORDER BY to_quest_id, from_quest_id`,
		)
		.all(...ids)) {
		const questId = Number(row.to_quest_id);
		const unlockedBy = unlockedByQuestId.get(questId) ?? [];
		unlockedBy.push(Number(row.from_quest_id));
		unlockedByQuestId.set(questId, unlockedBy);
	}

	return rows.map((row) => {
		const quest = mapQuestRow(row);
		const blockerCount = Number(row.blocker_count ?? 0);
		const effectiveDueAt = row.effective_due_at == null ? null : Number(row.effective_due_at);
		const rewards = rewardsByQuestId.get(quest.id) ?? [];
		const state = deriveQuestState(quest);
		const available =
			quest.deletedAt == null &&
			quest.resolvedAt == null &&
			(quest.notBeforeAt == null || quest.notBeforeAt <= now) &&
			blockerCount === 0;
		const markerId = deriveQuestMarkerId({
			state,
			available,
			hasUnclaimedReward: rewards.some((reward) => reward.claimedAt == null),
			notBeforeAt: quest.notBeforeAt,
			blockerCount,
			now,
		});

		return {
			detail: {
				...quest,
				state,
				markerId,
				effectiveDueAt,
				available,
				tagNames: tagNamesByQuestId.get(quest.id) ?? [],
				rewards,
				unlocksQuestIds: unlocksByQuestId.get(quest.id) ?? [],
				unlockedByQuestIds: unlockedByQuestId.get(quest.id) ?? [],
			},
			blockerCount,
		};
	});
}
