import type { QuestlogDb } from './database.ts';
import { deriveQuestMarkerId } from './markers/derive_quest_marker_id.ts';
import { deriveRumorMarkerId } from './markers/derive_rumor_marker_id.ts';
import { deriveQuestState } from './quests/derive_quest_state.ts';
import { deriveRumorState } from './rumors/derive_rumor_state.ts';
import type { QuestlogSearchResult } from './search_result.ts';

/**
 * Full-text search across quest and rumor content.
 */
export function searchQuestlog(db: QuestlogDb, query: string): QuestlogSearchResult[] {
	const trimmed = query.trim();
	if (!trimmed) {
		return [];
	}
	const now = Date.now();

	const questRows = db
		.prepare(
			`SELECT q.id,
              q.title,
              snippet(quests_fts, 1, '[', ']', '…', 10) AS snippet,
              q.started_at,
              q.resolved_at,
              q.success,
              q.not_before_at,
              EXISTS(
                SELECT 1
                FROM quest_rewards qr
                WHERE qr.quest_id = q.id
                  AND qr.deleted_at IS NULL
                  AND qr.claimed_at IS NULL
              ) AS has_unclaimed_rewards,
              EXISTS(
                SELECT 1
                FROM quest_unlocks qu
                JOIN quests blocker ON blocker.id = qu.from_quest_id
                WHERE qu.to_quest_id = q.id
                  AND qu.deleted_at IS NULL
                  AND blocker.deleted_at IS NULL
                  AND NOT (blocker.resolved_at IS NOT NULL AND blocker.success = 1)
              ) AS has_blockers
       FROM quests_fts
       JOIN quests q ON q.id = quests_fts.rowid
       WHERE quests_fts MATCH ? AND q.deleted_at IS NULL`,
		)
		.all(trimmed)
		.map((row) => {
			const state = deriveQuestState({
				startedAt: row.started_at == null ? null : Number(row.started_at),
				resolvedAt: row.resolved_at == null ? null : Number(row.resolved_at),
				success: row.success == null ? null : Number(row.success) === 1,
			});
			const notBeforeAt = row.not_before_at == null ? null : Number(row.not_before_at);
			const blockerCount = Number(row.has_blockers ?? 0);
			const available =
				state === 'open' && (notBeforeAt == null || notBeforeAt <= now) && blockerCount === 0;

			return {
				entityKind: 'quest' as const,
				entityId: Number(row.id),
				title: String(row.title),
				snippet: String(row.snippet),
				markerId: deriveQuestMarkerId({
					state,
					available,
					hasUnclaimedReward: Number(row.has_unclaimed_rewards ?? 0) === 1,
					notBeforeAt,
					blockerCount,
					now,
				}),
			};
		});

	const rumorRows = db
		.prepare(
			`SELECT r.id,
              r.title,
              snippet(rumors_fts, 1, '[', ']', '…', 10) AS snippet,
              r.settled_at,
              r.dismissed_at
       FROM rumors_fts
       JOIN rumors r ON r.id = rumors_fts.rowid
       WHERE rumors_fts MATCH ? AND r.deleted_at IS NULL`,
		)
		.all(trimmed)
		.map((row) => ({
			entityKind: 'rumor' as const,
			entityId: Number(row.id),
			title: String(row.title),
			snippet: String(row.snippet),
			markerId: deriveRumorMarkerId({
				state: deriveRumorState({
					settledAt: row.settled_at == null ? null : Number(row.settled_at),
					dismissedAt: row.dismissed_at == null ? null : Number(row.dismissed_at),
				}),
			}),
		}));

	return [...questRows, ...rumorRows];
}
