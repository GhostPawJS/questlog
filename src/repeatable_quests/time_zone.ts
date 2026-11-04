/** Validate an optional IANA time zone before persisting it. */
export function validateTimeZone(tz: string | null | undefined): void {
	if (tz == null) return;
	try {
		if (!tz || /^[+-]/.test(tz)) throw new Error();
		new Intl.DateTimeFormat('en', { timeZone: tz });
	} catch {
		throw new Error(`Invalid time zone: ${tz}`);
	}
}

/** Encode local calendar fields as a UTC timestamp for calendar arithmetic. */
export function wallClock(instant: number, tz: string): number {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(instant);
	const value = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	return (
		Date.UTC(
			value('year'),
			value('month') - 1,
			value('day'),
			value('hour'),
			value('minute'),
			value('second'),
		) +
		(((instant % 1000) + 1000) % 1000)
	);
}

/** Prefer the earlier fold instant; move nonexistent gap times forward. */
export function zonedInstant(wall: number, tz: string): number {
	const offsets = [-2, -1, 0, 1, 2].map((days) => {
		const instant = wall + days * 86_400_000;
		return wallClock(instant, tz) - instant;
	});
	const candidates = [...new Set(offsets)].map((offset) => wall - offset).sort((a, b) => a - b);
	return (
		candidates.find((instant) => wallClock(instant, tz) === wall) ??
		candidates.filter((instant) => wallClock(instant, tz) > wall)[0] ??
		wall
	);
}
