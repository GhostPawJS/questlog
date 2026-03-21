/**
 * Throws when a numeric value is negative.
 */
export function assertNonNegativeNumber(
	value: number | null | undefined,
	label: string,
): number | null | undefined {
	if (value != null && value < 0) {
		throw new Error(`${label} must not be negative.`);
	}
	return value;
}
