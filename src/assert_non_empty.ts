/**
 * Throws when a required string is empty after trimming.
 */
export function assertNonEmpty(value: string, label: string): string {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		throw new Error(`${label} must not be empty.`);
	}
	return trimmed;
}
