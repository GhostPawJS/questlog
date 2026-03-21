import type { QuestlogDb } from '../database';
import { mapQuestRow } from './map_quest_row';
import type { Quest } from './types';

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
