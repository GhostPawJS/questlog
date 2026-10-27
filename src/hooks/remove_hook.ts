import type { QuestlogDb } from '../database.ts';
import { withTransaction } from '../with_transaction.ts';

export function removeHook(db: QuestlogDb, id: number): void {
	withTransaction(db, () => {
		db.prepare('DELETE FROM hook_assignments WHERE target_id = ?').run(id);
		db.prepare('DELETE FROM hook_deliveries WHERE target_id = ?').run(id);
		db.prepare('DELETE FROM hook_targets WHERE id = ?').run(id);
	});
}
