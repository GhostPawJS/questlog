const DAY_MS = 86_400_000;

/**
 * Returns the UTC week boundary for a UTC day boundary timestamp.
 */
export function startOfUtcWeek(dayStart: number): number {
	const date = new Date(dayStart);
	return dayStart - date.getUTCDay() * DAY_MS;
}
