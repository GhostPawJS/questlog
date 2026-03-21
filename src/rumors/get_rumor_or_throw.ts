import type { QuestlogDb } from '../database.ts';
import { mapRumorRow } from './map_rumor_row.ts';
import type { Rumor } from './types.ts';

/**
 * Loads a single active rumor or throws.
 */
export function getRumorOrThrow(db: QuestlogDb, rumorId: number): Rumor {
	const row = db.prepare('SELECT * FROM rumors WHERE id = ? AND deleted_at IS NULL').get(rumorId);
	if (!row) {
		throw new Error(`Rumor ${rumorId} was not found.`);
	}
	return mapRumorRow(row);
}
