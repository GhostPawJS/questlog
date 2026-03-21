const WEEKDAY: Record<string, number> = {
	SU: 0,
	MO: 1,
	TU: 2,
	WE: 3,
	TH: 4,
	FR: 5,
	SA: 6,
};

/**
 * Parsed RRULE dimensions supported by questlog.
 */
export interface ParsedRRule {
	freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
	interval: number;
	count: number | null;
	until: number | null;
	byDay: number[] | null;
}

/**
 * Parses the questlog-supported RRULE subset.
 */
export function parseRRule(rrule: string): ParsedRRule {
	const parts = Object.fromEntries(
		rrule
			.split(';')
			.map((part) => part.trim())
			.filter(Boolean)
			.map((part) => {
				const [key, value] = part.split('=');
				return [key, value];
			}),
	);

	const freq = parts.FREQ;
	if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY' && freq !== 'YEARLY') {
		throw new Error(`Unsupported RRULE FREQ: ${freq ?? 'missing'}`);
	}

	const interval = parts.INTERVAL == null ? 1 : Number(parts.INTERVAL);
	if (!Number.isFinite(interval) || interval < 1) {
		throw new Error('RRULE INTERVAL must be a positive integer.');
	}

	const count = parts.COUNT == null ? null : Number(parts.COUNT);
	if (count != null && (!Number.isFinite(count) || count < 1)) {
		throw new Error('RRULE COUNT must be a positive integer.');
	}

	const until = parts.UNTIL == null ? null : Date.parse(parts.UNTIL);
	if (parts.UNTIL != null && Number.isNaN(until)) {
		throw new Error('RRULE UNTIL must be parseable as a date.');
	}

	const byDay =
		parts.BYDAY == null
			? null
			: parts.BYDAY.split(',').map((token: string) => {
					const value = WEEKDAY[token];
					if (value == null) {
						throw new Error(`Unsupported RRULE BYDAY token: ${token}`);
					}
					return value;
				});

	return { freq, interval, count, until, byDay };
}
