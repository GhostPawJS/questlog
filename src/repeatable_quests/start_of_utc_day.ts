/**
 * Returns the UTC day boundary for a timestamp.
 */
export function startOfUtcDay(timestamp: number): number {
	const date = new Date(timestamp);
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
