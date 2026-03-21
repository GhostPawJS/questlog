import type { QuestlogDb } from '../database.ts';
import { mapQuestRow } from './map_quest_row.ts';
import type { Quest } from './types.ts';

/**
 * Loads a single active quest or throws.
 */
export function getQuestOrThrow(db: QuestlogDb, questId: number): Quest {
	const row = db.prepare('SELECT * FROM quests WHERE id = ? AND deleted_at IS NULL').get(questId);
	if (!row) {
		throw new Error(`Quest ${questId} was not found.`);
	}
	return mapQuestRow(row);
}
