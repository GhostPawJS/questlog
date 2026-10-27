import { randomBytes } from 'node:crypto';
import type { QuestlogDb } from '../database.ts';
import { spawnDueRepeatableQuests } from '../repeatable_quests/spawn_due_repeatable_quests.ts';
import { normalizeTagName } from '../tags/normalize_tag_name.ts';
import { withTransaction } from '../with_transaction.ts';
import { detectHookEvents } from './detect_hook_events.ts';
import { listDeliveries } from './list_deliveries.ts';
import { listHooks } from './list_hooks.ts';
import { sendHookDelivery } from './send_hook_delivery.ts';
import type { HookEvent, HookEventType, TickOptions, TickResult } from './types.ts';

export async function tickQuestlog(db: QuestlogDb, options: TickOptions = {}): Promise<TickResult> {
	const now = options.now ?? options.clock?.() ?? Date.now();
	const result: TickResult = {
		events: [],
		batches: [],
		sent: 0,
		queued: 0,
		retrying: 0,
		failed: 0,
	};
	const claims: {
		delivery: ReturnType<typeof listDeliveries>[number];
		target: { id: number; url: string; secret: string; claim: string };
	}[] = [];
	const collect = () => {
		spawnDueRepeatableQuests(db, now);
		const detected = detectHookEvents(db, now);
		result.events = detected.filter(
			(e) => !db.prepare('SELECT id FROM hook_events WHERE id = ?').get(e.id),
		);
		for (const event of result.events)
			db.prepare('INSERT INTO hook_events(id, occurred_at, event) VALUES (?, ?, ?)').run(
				event.id,
				Date.parse(event.occurredAt),
				JSON.stringify(event),
			);
		for (const target of listHooks(db)) {
			const events = db
				.prepare(
					'SELECT e.event FROM hook_events e WHERE occurred_at >= ? AND NOT EXISTS (SELECT 1 FROM hook_assignments a WHERE a.target_id = ? AND a.event_id = e.id) ORDER BY occurred_at, id',
				)
				.all(target.createdAt, target.id)
				.map((row) => JSON.parse(String(row.event)) as HookEvent)
				.filter((event) => {
					if (!target.events.includes(event.type as HookEventType)) return false;
					if (target.tag == null) return true;
					return (
						event.questId !== undefined &&
						db
							.prepare(
								'SELECT 1 FROM quest_tags qt JOIN tags t ON t.id = qt.tag_id WHERE qt.quest_id = ? AND qt.deleted_at IS NULL AND t.deleted_at IS NULL AND t.normalized_name = ?',
							)
							.get(event.questId, normalizeTagName(target.tag)) !== undefined
					);
				});
			for (const event of events)
				db.prepare('INSERT INTO hook_assignments(target_id, event_id) VALUES (?, ?)').run(
					target.id,
					event.id,
				);
			const row = db
				.prepare('SELECT url, secret, lease_until FROM hook_targets WHERE id = ?')
				.get(target.id);
			if (!row || (row.lease_until != null && Number(row.lease_until) > now)) continue;
			let pending = listDeliveries(db).find(
				(d) => d.targetId === target.id && d.status === 'pending',
			);
			const queued = db
				.prepare(
					'SELECT e.event FROM hook_assignments a JOIN hook_events e ON e.id = a.event_id WHERE a.target_id = ? AND a.delivery_id IS NULL ORDER BY e.occurred_at, e.id',
				)
				.all(target.id)
				.map((r) => JSON.parse(String(r.event)) as HookEvent);
			if (!pending && queued.length) {
				const id = `d_${randomBytes(16).toString('hex')}`;
				db.prepare(
					"INSERT INTO hook_deliveries(id, target_id, events, status, next_attempt_at) VALUES (?, ?, ?, 'pending', ?)",
				).run(
					id,
					target.id,
					JSON.stringify(queued),
					Math.max(now, (target.lastWake ?? -Infinity) + target.minGap * 1000),
				);
				db.prepare(
					'UPDATE hook_assignments SET delivery_id = ? WHERE target_id = ? AND delivery_id IS NULL',
				).run(id, target.id);
				pending = listDeliveries(db).find((d) => d.id === id);
			}
			if (!pending) continue;
			// Unsent queued batches can grow until their first attempt. Retry batches remain immutable.
			if (
				pending.attempts === 0 &&
				queued.length &&
				!queued.every((e) => pending?.events.some((p) => p.id === e.id))
			) {
				pending.events.push(...queued);
				db.prepare('UPDATE hook_deliveries SET events = ? WHERE id = ?').run(
					JSON.stringify(pending.events),
					pending.id,
				);
				db.prepare(
					'UPDATE hook_assignments SET delivery_id = ? WHERE target_id = ? AND delivery_id IS NULL',
				).run(pending.id, target.id);
			}
			if (
				pending.nextAttemptAt > now ||
				(target.lastWake != null && target.lastWake + target.minGap * 1000 > now)
			)
				continue;
			if (pending.attempts >= 8) {
				db.prepare("UPDATE hook_deliveries SET status = 'failed' WHERE id = ?").run(pending.id);
				continue;
			}
			const claim = randomBytes(16).toString('hex');
			db.prepare(
				'UPDATE hook_targets SET claim = ?, lease_until = ?, last_wake = ? WHERE id = ?',
			).run(claim, now + 120000, now, target.id);
			db.prepare(
				'UPDATE hook_deliveries SET attempts = attempts + 1, last_attempt_at = ? WHERE id = ?',
			).run(now, pending.id);
			pending.attempts++;
			pending.lastAttemptAt = now;
			result.batches.push({ targetId: target.id, events: pending.events });
			claims.push({
				delivery: pending,
				target: { id: target.id, url: String(row.url), secret: String(row.secret), claim },
			});
		}
	};
	if (options.dryRun) {
		const rollback = new Error('preview rollback');
		try {
			withTransaction(db, () => {
				collect();
				throw rollback;
			});
		} catch (error) {
			if (error !== rollback) throw error;
		}
	} else withTransaction(db, collect);
	if (!options.dryRun) {
		const sent = await Promise.all(
			claims.map((claim) => sendHookDelivery(db, claim.delivery, claim.target, options)),
		);
		result.sent = sent.filter(Boolean).length;
	}
	const deliveries = listDeliveries(db);
	result.queued =
		deliveries.filter((d) => d.status === 'pending' && d.attempts === 0).length +
		Number(
			db
				.prepare(
					'SELECT COUNT(DISTINCT target_id) AS n FROM hook_assignments WHERE delivery_id IS NULL',
				)
				.get()?.n ?? 0,
		);
	result.retrying = deliveries.filter((d) => d.status === 'pending' && d.attempts > 0).length;
	result.failed = deliveries.filter((d) => d.status === 'failed').length;
	return result;
}
