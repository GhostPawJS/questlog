import type { ParsedRRule } from './parse_rrule.ts';

const WEEK_MS = 7 * 86_400_000;

/**
 * Advances a recurrence anchor by one supported interval.
 */
export function advanceAnchor(
	anchorAt: number,
	freq: ParsedRRule['freq'],
	interval: number,
): number {
	const date = new Date(anchorAt);
	if (freq === 'MONTHLY') {
		date.setUTCMonth(date.getUTCMonth() + interval);
		return date.getTime();
	}
	if (freq === 'YEARLY') {
		date.setUTCFullYear(date.getUTCFullYear() + interval);
		return date.getTime();
	}
	return anchorAt + interval * WEEK_MS;
}
