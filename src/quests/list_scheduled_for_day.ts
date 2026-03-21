import type { QuestlogDb } from '../database';
import { listQuestDetails } from './list_quest_details';
import { overlapsScheduleWindow } from './overlaps_schedule_window';
import type { QuestDetail, QuestListFilters } from './types';

/**
 * Lists quests scheduled for a UTC day window.
 */
export function listScheduledForDay(
	db: QuestlogDb,
	dayStart: number,
	dayEnd: number,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return listQuestDetails(db, filters, now).filter((quest) =>
		overlapsScheduleWindow(quest.scheduledStartAt, quest.scheduledEndAt, dayStart, dayEnd),
	);
}
