import type { QuestlogDb } from '../database';
import { listQuestDetails } from './list_quest_details';
import { overlapsScheduleWindow } from './overlaps_schedule_window';
import type { QuestDetail, QuestListFilters } from './types';

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
