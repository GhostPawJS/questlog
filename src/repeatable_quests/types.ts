import type { MarkerId } from '../markers/types';
import type { RepeatableQuestRewardInput } from '../rewards/types';

/**
 * A recurring definition that spawns concrete quest instances for due anchors.
 */
export interface RepeatableQuest {
	id: number;
	questlineId: number | null;
	title: string;
	objective: string;
	rrule: string;
	anchorAt: number;
	notBeforeOffsetSeconds: number | null;
	dueOffsetSeconds: number | null;
	scheduledStartOffsetSeconds: number | null;
	scheduledEndOffsetSeconds: number | null;
	allDay: boolean;
	estimateSeconds: number | null;
	createdAt: number;
	updatedAt: number;
	archivedAt: number | null;
	deletedAt: number | null;
}

/**
 * Input for creating a recurring quest definition.
 */
export interface CreateRepeatableQuestInput {
	title: string;
	objective: string;
	questlineId?: number | null;
	rrule: string;
	anchorAt: number;
	notBeforeOffsetSeconds?: number | null;
	dueOffsetSeconds?: number | null;
	scheduledStartOffsetSeconds?: number | null;
	scheduledEndOffsetSeconds?: number | null;
	allDay?: boolean;
	estimateSeconds?: number | null;
	tags?: string[];
	rewards?: RepeatableQuestRewardInput[];
	now?: number;
}

/**
 * Input for updating a repeatable quest definition.
 */
export interface UpdateRepeatableQuestInput {
	title?: string;
	objective?: string;
	questlineId?: number | null;
	rrule?: string;
	anchorAt?: number;
	notBeforeOffsetSeconds?: number | null;
	dueOffsetSeconds?: number | null;
	scheduledStartOffsetSeconds?: number | null;
	scheduledEndOffsetSeconds?: number | null;
	allDay?: boolean;
	estimateSeconds?: number | null;
	archivedAt?: number | null;
	now?: number;
}

/**
 * A recurrence anchor that is due for materialization.
 */
export interface DueRepeatableAnchor {
	repeatableQuestId: number;
	anchorAt: number;
	markerId: MarkerId;
}
