import { createHmac, randomBytes } from 'node:crypto';
import type { QuestlogDb } from '../database.ts';
import { questlogVersion } from '../version.ts';
import { withTransaction } from '../with_transaction.ts';
import { hookLabel } from './hook_label.ts';
import type { HookDelivery, TickOptions } from './types.ts';

/** Sends only work already claimed transactionally. The claim fences stale completions. */
export async function sendHookDelivery(
	db: QuestlogDb,
	delivery: HookDelivery,
	target: { id: number; url: string; secret: string; claim: string },
	options: TickOptions,
): Promise<boolean> {
	const now = options.now ?? options.clock?.() ?? Date.now();
	const timestamp = String(Math.floor(now / 1000));
	const body = JSON.stringify({
		type: 'questlog.events',
		db: hookLabel(db),
		deliveryId: delivery.id,
		sentAt: new Date(now).toISOString(),
		events: delivery.events,
	});
	const signature = createHmac('sha256', target.secret)
		.update(`${timestamp}.${body}`)
		.digest('hex');
	let status: number | null = null;
	let errorClass: string | null = null;
	try {
		const response = await (options.fetch ?? globalThis.fetch)(target.url, {
			method: 'POST',
			redirect: 'error',
			headers: {
				'user-agent': `questlog/${questlogVersion}`,
				...JSON.parse(
					String(
						db.prepare('SELECT headers FROM hook_targets WHERE id = ?').get(target.id)?.headers ??
							'{}',
					),
				),
				'content-type': 'application/json',
				'x-questlog-delivery': delivery.id,
				'x-questlog-timestamp': timestamp,
				'x-questlog-signature': `sha256=${signature}`,
			},
			body,
			signal: AbortSignal.timeout(Math.max(1, Math.min(options.timeoutMs ?? 5000, 5000))),
		});
		status = response.status;
		await response.body?.cancel();
	} catch (error) {
		// Never persist exception messages, URLs, or arbitrary exception names.
		errorClass =
			error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
				? error.name
				: 'NetworkError';
	}
	const delivered = status != null && status >= 200 && status < 300;
	const completedAt = options.now ?? options.clock?.() ?? Date.now();
	withTransaction(db, () => {
		if (
			!db
				.prepare('SELECT id FROM hook_targets WHERE id = ? AND claim = ?')
				.get(target.id, target.claim)
		)
			return;
		const delay = Math.min(3600000, 30000 * 2 ** (delivery.attempts - 1));
		const jitter = Number.parseInt(randomBytes(2).toString('hex'), 16) % 1000;
		db.prepare(
			'UPDATE hook_deliveries SET status = ?, http_status = ?, error_class = ?, next_attempt_at = ? WHERE id = ?',
		).run(
			delivered ? 'delivered' : delivery.attempts >= 8 ? 'failed' : 'pending',
			status,
			errorClass,
			completedAt + delay + jitter,
			delivery.id,
		);
		db.prepare(
			'UPDATE hook_targets SET claim = NULL, lease_until = NULL WHERE id = ? AND claim = ?',
		).run(target.id, target.claim);
		db.prepare(
			"DELETE FROM hook_deliveries WHERE target_id = ? AND status = 'delivered' AND id NOT IN (SELECT id FROM hook_deliveries WHERE target_id = ? AND status = 'delivered' ORDER BY last_attempt_at DESC, id DESC LIMIT 500)",
		).run(target.id, target.id);
	});
	return delivered;
}
