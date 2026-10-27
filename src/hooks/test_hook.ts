import { randomBytes } from 'node:crypto';
import type { QuestlogDb } from '../database.ts';
import { withTransaction } from '../with_transaction.ts';
import { sendHookDelivery } from './send_hook_delivery.ts';
import type { HookDelivery, TickOptions } from './types.ts';

export async function testHook(
	db: QuestlogDb,
	id: number,
	options: TickOptions = {},
): Promise<{ id: string; delivered: boolean }> {
	const now = options.now ?? options.clock?.() ?? Date.now();
	const claim = randomBytes(16).toString('hex');
	const delivery: HookDelivery = {
		id: `d_${randomBytes(16).toString('hex')}`,
		targetId: id,
		events: [
			{
				id: `e_test_${randomBytes(16).toString('hex')}`,
				type: 'hook.test',
				occurredAt: new Date(now).toISOString(),
			},
		],
		status: 'pending',
		attempts: 1,
		lastAttemptAt: now,
		httpStatus: null,
		errorClass: null,
		nextAttemptAt: now,
	};
	const target = withTransaction(db, () => {
		const row = db
			.prepare('SELECT url, secret, lease_until FROM hook_targets WHERE id = ?')
			.get(id);
		if (!row) throw new Error('Hook not found');
		if (row.lease_until != null && Number(row.lease_until) > now)
			throw new Error('Hook delivery is in progress');
		db.prepare(
			'INSERT INTO hook_deliveries(id, target_id, events, status, attempts, last_attempt_at, next_attempt_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
		).run(delivery.id, id, JSON.stringify(delivery.events), 'pending', 1, now, now);
		db.prepare(
			'UPDATE hook_targets SET claim = ?, lease_until = ?, last_wake = ? WHERE id = ?',
		).run(claim, now + 120000, now, id);
		return { id, url: String(row.url), secret: String(row.secret), claim };
	});
	return { id: delivery.id, delivered: await sendHookDelivery(db, delivery, target, options) };
}
