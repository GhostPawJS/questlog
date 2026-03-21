import type { MarkerId } from '../markers/types.ts';
import type { CreateQuestlineInput, Questline } from '../questlines/types.ts';
import type { CreateQuestInput, Quest } from '../quests/types.ts';

/**
 * A non-committed intake item that may later yield quests, a questline, both, or nothing.
 */
export interface Rumor {
	id: number;
	title: string;
	details: string | null;
	markerId: MarkerId | null;
	createdAt: number;
	updatedAt: number;
	settledAt: number | null;
	dismissedAt: number | null;
	deletedAt: number | null;
}

/**
 * The lifecycle state derived from a rumor's timestamps.
 */
export type RumorState = 'open' | 'settled' | 'dismissed';

/**
 * Input for capturing a new rumor.
 */
export interface CaptureRumorInput {
	title: string;
	details?: string | null;
	now?: number;
}

/**
 * A downstream artifact created from rumor settlement.
 */
export interface RumorOutput {
	entityKind: 'quest' | 'questline';
	entityId: number;
}

/**
 * A rumor with derived state and downstream outputs.
 */
export interface RumorDetail extends Rumor {
	state: RumorState;
	outputs: RumorOutput[];
}

/**
 * Structured rumor settlement plan.
 */
export interface SettleRumorInput {
	questline?: CreateQuestlineInput;
	quests?: CreateQuestInput[];
	settledAt?: number;
}

/**
 * Result returned after settling a rumor into downstream artifacts.
 */
export interface SettleRumorResult {
	rumor: Rumor;
	questline: Questline | null;
	quests: Quest[];
}
