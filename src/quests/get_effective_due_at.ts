import type { QuestlogDb } from '../database.ts';
import type { Quest } from './types.ts';

/**
 * Computes a quest's effective due date, inheriting from its questline when needed.
 */
export function getEffectiveDueAt(db: QuestlogDb, quest: Quest): number | null {
	if (quest.dueAt != null) {
		return quest.dueAt;
	}
	if (quest.questlineId == null) {
		return null;
	}
	const row = db
		.prepare('SELECT due_at FROM questlines WHERE id = ? AND deleted_at IS NULL')
		.get(quest.questlineId);
	return row?.due_at == null ? null : Number(row.due_at);
}
