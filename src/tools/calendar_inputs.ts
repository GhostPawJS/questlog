import { parseCalendarTime } from './parse_calendar_time.ts';

export type CalendarInputs<T> = T extends readonly (infer U)[]
	? CalendarInputs<U>[]
	: T extends object
		? {
				[K in keyof T]: K extends 'dueAt' | 'scheduledStartAt' | 'scheduledEndAt'
					? T[K] | string
					: CalendarInputs<T[K]>;
			} & { tz?: string }
		: T;

/** Clone before normalization, so frozen/shared caller inputs stay untouched. */
export function normalizeCalendarInputs<T>(input: T, now = Date.now()): T {
	const root = structuredClone(input);
	const zone = (root as { tz?: string } | null)?.tz;
	if (zone !== undefined) {
		if (typeof zone !== 'string') throw new Error('tz: expected IANA time zone string');
		new Intl.DateTimeFormat('en', { timeZone: zone }).format(now);
	}
	const visit = (value: unknown, path: string, reference: number): void => {
		if (!value || typeof value !== 'object') return;
		if (Array.isArray(value)) {
			value.forEach((item, i) => {
				visit(item, `${path}[${i}]`, reference);
			});
			return;
		}
		const record = value as Record<string, unknown>;
		const clock = typeof record.now === 'number' ? record.now : reference;
		for (const [key, item] of Object.entries(record)) {
			if (['dueAt', 'scheduledStartAt', 'scheduledEndAt'].includes(key) && item != null)
				record[key] = parseCalendarTime(
					item as number | string,
					`${path}.${key}`,
					clock,
					zone,
				).timestamp;
			else visit(item, `${path}.${key}`, clock);
		}
	};
	visit(root, 'input', now);
	return root;
}
