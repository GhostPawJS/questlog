import type { QuestState } from './quest_state';
import type { Quest } from './types';

/**
 * Derives quest state from start, resolution, and success timestamps.
 */
export function deriveQuestState(quest: Quest): QuestState {
	if (quest.resolvedAt != null && quest.success === true) {
		return 'done';
	}
	if (quest.resolvedAt != null && quest.success === false) {
		return 'abandoned';
	}
	if (quest.startedAt != null) {
		return 'in_progress';
	}
	return 'open';
}
