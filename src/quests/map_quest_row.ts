import type { Quest } from './types.ts';

function asBoolean(value: unknown): boolean {
	return Number(value) === 1;
}

/**
 * Maps a quest row into its public entity shape.
 */
export function mapQuestRow(row: Record<string, unknown>): Quest {
	return {
		id: Number(row.id),
		questlineId: row.questline_id == null ? null : Number(row.questline_id),
		sourceRumorId: row.source_rumor_id == null ? null : Number(row.source_rumor_id),
		spawnedByQuestId: row.spawned_by_quest_id == null ? null : Number(row.spawned_by_quest_id),
		spawnedFromRepeatableId:
			row.spawned_from_repeatable_id == null ? null : Number(row.spawned_from_repeatable_id),
		spawnedForAt: row.spawned_for_at == null ? null : Number(row.spawned_for_at),
		title: String(row.title),
		objective: String(row.objective),
		outcome: row.outcome == null ? null : String(row.outcome),
		createdAt: Number(row.created_at),
		updatedAt: Number(row.updated_at),
		startedAt: row.started_at == null ? null : Number(row.started_at),
		resolvedAt: row.resolved_at == null ? null : Number(row.resolved_at),
		success: row.success == null ? null : asBoolean(row.success),
		effortSeconds: Number(row.effort_seconds),
		estimateSeconds: row.estimate_seconds == null ? null : Number(row.estimate_seconds),
		notBeforeAt: row.not_before_at == null ? null : Number(row.not_before_at),
		dueAt: row.due_at == null ? null : Number(row.due_at),
		scheduledStartAt: row.scheduled_start_at == null ? null : Number(row.scheduled_start_at),
		scheduledEndAt: row.scheduled_end_at == null ? null : Number(row.scheduled_end_at),
		allDay: asBoolean(row.all_day),
		deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
	};
}
