import { randomBytes } from 'node:crypto';
import type { QuestlogDb } from '../database.ts';
import { normalizeTagName } from '../tags/normalize_tag_name.ts';
import { type HookEventType, hookEventTypes } from './types.ts';

/** The secret is returned only at creation. Store it securely at the receiver. */
export function addHook(
	db: QuestlogDb,
	input: {
		url: string;
		tag?: string;
		events?: HookEventType[];
		minGap?: number;
		secret?: string;
		now?: number;
	},
): { id: number; secret: string } {
	let url: URL;
	try {
		url = new URL(input.url);
	} catch {
		throw new Error('Expected an HTTP or HTTPS URL');
	}
	if (!['http:', 'https:'].includes(url.protocol))
		throw new Error(`unsupported scheme ${url.protocol}; use http or https`);
	if (url.username || url.password)
		throw new Error(
			'URL userinfo is not supported; use a custom header (--header or --header-stdin) or a query key instead',
		);
	const minGap = input.minGap ?? 60;
	if (!Number.isSafeInteger(minGap) || minGap < 0)
		throw new Error(`Min gap ${minGap} must be a nonnegative integer`);
	const events = input.events ?? [...hookEventTypes];
	if (!events.length || events.some((e) => !hookEventTypes.includes(e)))
		throw new Error(
			`unknown event ${events.find((e) => !hookEventTypes.includes(e)) ?? '(empty)'}; valid: ${hookEventTypes.join(', ')}`,
		);
	if (input.tag !== undefined && !normalizeTagName(input.tag))
		throw new Error(`Expected a tag name: ${JSON.stringify(input.tag)}`);
	const secret = input.secret ?? randomBytes(32).toString('hex');
	if (!secret.trim()) throw new Error('Expected a nonempty signing secret');
	const result = db
		.prepare(
			'INSERT INTO hook_targets(url, secret, tag, events, min_gap, created_at) VALUES (?, ?, ?, ?, ?, ?)',
		)
		.run(
			url.href,
			secret,
			input.tag === undefined ? null : normalizeTagName(input.tag),
			JSON.stringify(events),
			minGap,
			input.now ?? Date.now(),
		);
	return { id: Number(result.lastInsertRowid), secret };
}
