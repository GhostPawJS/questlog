/**
 * A higher-level semantic arc that groups related quests and may provide a shared deadline.
 */
export interface Questline {
	id: number;
	sourceRumorId: number | null;
	title: string;
	description: string | null;
	startsAt: number | null;
	dueAt: number | null;
	createdAt: number;
	updatedAt: number;
	archivedAt: number | null;
	deletedAt: number | null;
}

/**
 * Input for creating a new questline.
 */
export interface CreateQuestlineInput {
	title: string;
	description?: string | null;
	startsAt?: number | null;
	dueAt?: number | null;
	sourceRumorId?: number | null;
	now?: number;
}

/**
 * Input for updating mutable questline fields.
 */
export interface UpdateQuestlineInput {
	title?: string;
	description?: string | null;
	startsAt?: number | null;
	dueAt?: number | null;
	archivedAt?: number | null;
	now?: number;
}

/**
 * A questline plus computed progress counts.
 */
export interface QuestlineDetail extends Questline {
	totalQuests: number;
	openQuests: number;
	inProgressQuests: number;
	doneQuests: number;
	abandonedQuests: number;
	availableQuests: number;
	overdueQuests: number;
}
