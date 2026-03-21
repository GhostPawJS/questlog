import { assertNonEmpty } from '../assert_non_empty.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { getQuestOrThrow } from './get_quest_or_throw.ts';
import type { Quest } from './types.ts';

/**
 * Resolves a quest with terminal success, timestamp, and outcome truth.
 */
export function resolveQuest(
	db: QuestlogDb,
	questId: number,
	success: boolean,
	outcome: string,
	resolvedAt?: number,
): Quest {
	const current = getQuestOrThrow(db, questId);
	if (current.resolvedAt != null) {
		throw new Error('Resolved quests cannot be resolved again.');
	}
	const now = resolveNow(resolvedAt);
	db.prepare(
		`UPDATE quests
     SET outcome = ?,
         resolved_at = ?,
         success = ?,
         updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(assertNonEmpty(outcome, 'Quest outcome'), now, success ? 1 : 0, now, questId);
	return getQuestOrThrow(db, questId);
}
