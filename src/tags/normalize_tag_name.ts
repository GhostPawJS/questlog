/**
 * Normalizes a tag name for uniqueness and lookup.
 */
export function normalizeTagName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
