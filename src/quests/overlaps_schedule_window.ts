/**
 * Returns whether a quest schedule overlaps a window.
 */
export function overlapsScheduleWindow(
	start: number | null,
	end: number | null,
	windowStart: number,
	windowEnd: number,
): boolean {
	if (start == null) {
		return false;
	}
	const effectiveEnd = end ?? start;
	return start < windowEnd && effectiveEnd >= windowStart;
}
