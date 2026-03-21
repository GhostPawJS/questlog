import type { RepeatableQuest } from './types';

function asBoolean(value: unknown): boolean {
	return Number(value) === 1;
}

/**
 * Maps a repeatable quest row into its public entity shape.
 */
export function mapRepeatableQuestRow(row: Record<string, unknown>): RepeatableQuest {
	return {
		id: Number(row.id),
		questlineId: row.questline_id == null ? null : Number(row.questline_id),
		title: String(row.title),
		objective: String(row.objective),
		rrule: String(row.rrule),
		anchorAt: Number(row.anchor_at),
		notBeforeOffsetSeconds:
			row.not_before_offset_seconds == null ? null : Number(row.not_before_offset_seconds),
		dueOffsetSeconds: row.due_offset_seconds == null ? null : Number(row.due_offset_seconds),
		scheduledStartOffsetSeconds:
			row.scheduled_start_offset_seconds == null
				? null
				: Number(row.scheduled_start_offset_seconds),
		scheduledEndOffsetSeconds:
			row.scheduled_end_offset_seconds == null ? null : Number(row.scheduled_end_offset_seconds),
		allDay: asBoolean(row.all_day),
		estimateSeconds: row.estimate_seconds == null ? null : Number(row.estimate_seconds),
		createdAt: Number(row.created_at),
		updatedAt: Number(row.updated_at),
		archivedAt: row.archived_at == null ? null : Number(row.archived_at),
		deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
	};
}
