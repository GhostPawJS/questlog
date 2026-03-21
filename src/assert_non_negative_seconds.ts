/**
 * Throws when an integer-seconds value is negative.
 */
export function assertNonNegativeSeconds(
	value: number | null | undefined,
	label: string,
): number | null | undefined {
	if (value != null && value < 0) {
		throw new Error(`${label} must not be negative.`);
	}
	return value;
}
