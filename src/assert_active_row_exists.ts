import type { QuestlogDb } from './database';

/**
 * Throws when a referenced row is missing or soft-deleted.
 */
export function assertActiveRowExists(
	db: QuestlogDb,
	table: string,
	id: number,
	label: string,
): void {
	const row = db.prepare(`SELECT id FROM ${table} WHERE id = ? AND deleted_at IS NULL`).get(id);
	if (!row) {
		throw new Error(`${label} ${id} was not found.`);
	}
}
