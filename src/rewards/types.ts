/**
 * A generic reward attached to a concrete quest.
 */
export interface QuestReward {
	id: number;
	questId: number;
	kind: string;
	name: string;
	description: string | null;
	quantity: number | null;
	createdAt: number;
	claimedAt: number | null;
	deletedAt: number | null;
}

/**
 * A reward template attached to a repeatable quest and copied into spawned quests.
 */
export interface RepeatableQuestReward {
	id: number;
	repeatableQuestId: number;
	kind: string;
	name: string;
	description: string | null;
	quantity: number | null;
	createdAt: number;
	deletedAt: number | null;
}

/**
 * Input for attaching a reward to a concrete quest.
 */
export interface QuestRewardInput {
	kind: string;
	name: string;
	description?: string | null;
	quantity?: number | null;
	now?: number;
}

/**
 * Input for attaching a reward template to a repeatable quest.
 */
export interface RepeatableQuestRewardInput {
	kind: string;
	name: string;
	description?: string | null;
	quantity?: number | null;
	now?: number;
}
