import type { QuestlogDb } from '../database.ts';
import type { HookDelivery } from './types.ts';

export function listDeliveries(
	db: QuestlogDb,
	options: { questId?: number; includeDelivered?: boolean } = {},
): HookDelivery[] {
	return db
		.prepare(
			`SELECT * FROM hook_deliveries ${options.includeDelivered ? '' : "WHERE status <> 'delivered'"} ORDER BY target_id, next_attempt_at, id`,
		)
		.all()
		.map(
			(row): HookDelivery => ({
				id: String(row.id),
				targetId: Number(row.target_id),
				events: JSON.parse(String(row.events)),
				status: row.status as HookDelivery['status'],
				attempts: Number(row.attempts),
				lastAttemptAt: row.last_attempt_at == null ? null : Number(row.last_attempt_at),
				httpStatus: row.http_status == null ? null : Number(row.http_status),
				errorClass: row.error_class == null ? null : String(row.error_class),
				nextAttemptAt: Number(row.next_attempt_at),
			}),
		)
		.filter(
			(d) => options.questId === undefined || d.events.some((e) => e.questId === options.questId),
		);
}
