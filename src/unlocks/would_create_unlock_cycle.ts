import type { QuestlogDb } from '../database.ts';

/**
 * Detects whether adding an unlock edge would create a cycle.
 */
export function wouldCreateUnlockCycle(
	db: QuestlogDb,
	fromQuestId: number,
	toQuestId: number,
): boolean {
	const frontier = [toQuestId];
	const seen = new Set<number>();

	while (frontier.length > 0) {
		const current = frontier.pop() as number;
		if (current === fromQuestId) {
			return true;
		}
		if (seen.has(current)) {
			continue;
		}
		seen.add(current);

		const rows = db
			.prepare(
				`SELECT to_quest_id
         FROM quest_unlocks
         WHERE from_quest_id = ? AND deleted_at IS NULL`,
			)
			.all(current);

		for (const row of rows) {
			frontier.push(Number(row.to_quest_id));
		}
	}

	return false;
}
