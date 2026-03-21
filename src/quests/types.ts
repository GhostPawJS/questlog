import type { MarkerId } from '../markers/types.ts';
import type { QuestReward, QuestRewardInput } from '../rewards/types.ts';
import type { QuestState } from './quest_state.ts';

/**
 * One real commitment with one objective and one terminal outcome.
 */
export interface Quest {
	id: number;
	questlineId: number | null;
	sourceRumorId: number | null;
	spawnedByQuestId: number | null;
	spawnedFromRepeatableId: number | null;
	spawnedForAt: number | null;
	title: string;
	objective: string;
	outcome: string | null;
	createdAt: number;
	updatedAt: number;
	startedAt: number | null;
	resolvedAt: number | null;
	success: boolean | null;
	effortSeconds: number;
	estimateSeconds: number | null;
	notBeforeAt: number | null;
	dueAt: number | null;
	scheduledStartAt: number | null;
	scheduledEndAt: number | null;
	allDay: boolean;
	deletedAt: number | null;
}

/**
 * Input for creating a concrete quest.
 */
export interface CreateQuestInput {
	title: string;
	objective: string;
	questlineId?: number | null;
	sourceRumorId?: number | null;
	spawnedByQuestId?: number | null;
	spawnedFromRepeatableId?: number | null;
	spawnedForAt?: number | null;
	estimateSeconds?: number | null;
	notBeforeAt?: number | null;
	dueAt?: number | null;
	scheduledStartAt?: number | null;
	scheduledEndAt?: number | null;
	allDay?: boolean;
	tags?: string[];
	rewards?: QuestRewardInput[];
	now?: number;
}

/**
 * Intent-shaped quest temporal planning input.
 */
export interface PlanQuestTimeInput {
	notBeforeAt?: number | null;
	dueAt?: number | null;
	scheduledStartAt?: number | null;
	scheduledEndAt?: number | null;
	allDay?: boolean;
	estimateSeconds?: number | null;
	now?: number;
}

/**
 * A follow-up quest to create atomically while abandoning an existing quest.
 */
export interface FollowupQuestInput
	extends Omit<CreateQuestInput, 'sourceRumorId' | 'spawnedByQuestId'> {
	unlocksParent?: boolean;
}

/**
 * Summary returned when abandoning a quest and atomically creating follow-up work.
 */
export interface AbandonQuestResult {
	abandonedQuest: Quest;
	followupQuests: Quest[];
}

/**
 * Shared quest list filters.
 */
export interface QuestListFilters {
	questlineId?: number;
	tagNames?: string[];
	includeDeleted?: boolean;
}

/**
 * A concrete quest with derived state and expanded relationships for reads.
 */
export interface QuestDetail extends Quest {
	state: QuestState;
	markerId: MarkerId | null;
	effectiveDueAt: number | null;
	available: boolean;
	tagNames: string[];
	rewards: QuestReward[];
	unlocksQuestIds: number[];
	unlockedByQuestIds: number[];
}
