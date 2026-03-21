import type { QuestlogDb } from '../database';
import { mapQuestlineRow } from './map_questline_row';
import type { Questline } from './types';

/**
 * Loads a single active questline or throws.
 */
export function getQuestlineOrThrow(db: QuestlogDb, questlineId: number): Questline {
	const row = db
		.prepare('SELECT * FROM questlines WHERE id = ? AND deleted_at IS NULL')
		.get(questlineId);
	if (!row) {
		throw new Error(`Questline ${questlineId} was not found.`);
	}
	return mapQuestlineRow(row);
}
