import type { QuestlogDb } from '../database.ts';
import type { HookTarget } from './types.ts';

export function listHooks(db: QuestlogDb): HookTarget[] {
	return db
		.prepare(`SELECT id, url, tag, events, min_gap, created_at, last_wake,
 (SELECT COUNT(*) FROM hook_assignments a LEFT JOIN hook_deliveries d ON d.id = a.delivery_id WHERE a.target_id = t.id AND (a.delivery_id IS NULL OR d.status = 'pending')) AS pending,
 (SELECT COUNT(*) FROM hook_deliveries d WHERE d.target_id = t.id AND d.status = 'failed') AS failed
 FROM hook_targets t ORDER BY id`)
		.all()
		.map((row) => {
			const url = new URL(String(row.url));
			url.username = '';
			url.password = '';
			url.search = '';
			url.hash = '';
			return {
				id: Number(row.id),
				scope: row.tag == null ? 'database' : 'tag',
				url: url.href,
				tag: row.tag == null ? null : String(row.tag),
				events: JSON.parse(String(row.events)),
				minGap: Number(row.min_gap),
				createdAt: Number(row.created_at),
				lastWake: row.last_wake == null ? null : Number(row.last_wake),
				pending: Number(row.pending),
				failed: Number(row.failed),
			};
		});
}
