import type { QuestlogDb } from '../database.ts';
import { listQuestDetails } from './list_quest_details.ts';
import { overlapsScheduleWindow } from './overlaps_schedule_window.ts';
import type { QuestDetail, QuestListFilters } from './types.ts';

/**
 * Lists quests whose scheduled window overlaps now.
 */
export function listScheduledNow(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return listQuestDetails(db, filters, now).filter((quest) =>
		overlapsScheduleWindow(quest.scheduledStartAt, quest.scheduledEndAt, now, now + 1),
	);
}
