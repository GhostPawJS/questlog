import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';

/**
 * Copies active repeatable quest reward templates onto a spawned quest.
 */
export function copyRepeatableQuestRewardsToQuest(
	db: QuestlogDb,
	repeatableQuestId: number,
	questId: number,
	now?: number,
): void {
	const effectiveNow = resolveNow(now);
	const rows = db
		.prepare(
			`SELECT kind, name, description, quantity
       FROM repeatable_quest_rewards
       WHERE repeatable_quest_id = ? AND deleted_at IS NULL`,
		)
		.all(repeatableQuestId);

	for (const row of rows) {
		db.prepare(
			`INSERT INTO quest_rewards (quest_id, kind, name, description, quantity, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
		).run(
			questId,
			String(row.kind),
			String(row.name),
			row.description == null ? null : String(row.description),
			row.quantity == null ? null : Number(row.quantity),
			effectiveNow,
		);
	}
}
