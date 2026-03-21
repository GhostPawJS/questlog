import type { QuestState } from '../quests/quest_state.ts';
import type { MarkerId } from './types.ts';

export interface DeriveQuestMarkerIdInput {
	state: QuestState;
	available: boolean;
	hasUnclaimedReward: boolean;
	notBeforeAt: number | null;
	blockerCount: number;
	now: number;
}

export function deriveQuestMarkerId({
	state,
	available,
	hasUnclaimedReward,
	notBeforeAt,
	blockerCount,
	now,
}: DeriveQuestMarkerIdInput): MarkerId | null {
	if (state === 'done') {
		return hasUnclaimedReward ? 'progress.complete' : null;
	}

	if (state === 'abandoned') {
		return null;
	}

	if (state === 'in_progress') {
		return 'progress.incomplete';
	}

	if (available) {
		return 'attention.available';
	}

	if (notBeforeAt != null && notBeforeAt > now) {
		return 'attention.available.future';
	}

	if (blockerCount > 0) {
		return 'progress.incomplete';
	}

	return null;
}
