import type { QuestlogDb } from '../database.ts';
import { mapRumorRow } from './map_rumor_row.ts';
import type { Rumor } from './types.ts';

/**
 * Lists all active rumors.
 */
export function listRumors(db: QuestlogDb): Rumor[] {
	return db
		.prepare('SELECT * FROM rumors WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC')
		.all()
		.map(mapRumorRow);
}
