import type { QuestlogDb } from '../database';
import { mapRepeatableQuestRow } from './map_repeatable_quest_row';
import type { RepeatableQuest } from './types';

/**
 * Loads a single active repeatable quest or throws.
 */
export function getRepeatableQuestOrThrow(
	db: QuestlogDb,
	repeatableQuestId: number,
): RepeatableQuest {
	const row = db
		.prepare('SELECT * FROM repeatable_quests WHERE id = ? AND deleted_at IS NULL')
		.get(repeatableQuestId);
	if (!row) {
		throw new Error(`Repeatable quest ${repeatableQuestId} was not found.`);
	}
	return mapRepeatableQuestRow(row);
}
