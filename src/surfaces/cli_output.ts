export function enrichPlainJson(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(enrichPlainJson);
	if (value === null || typeof value !== 'object') return value;
	const result: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value)) {
		result[key] = enrichPlainJson(entry);
		if (
			key.endsWith('At') &&
			typeof entry === 'number' &&
			Number.isFinite(new Date(entry).getTime())
		)
			result[`${key}Iso`] = new Date(entry).toISOString();
	}
	return result;
}

export function suggestCommand(input: string, names: string[]): string | undefined {
	let best: string | undefined;
	let distance = 3;
	for (const name of names) {
		let row = Array.from({ length: name.length + 1 }, (_, i) => i);
		for (let i = 0; i < input.length; i++) {
			const next = [i + 1];
			for (let j = 0; j < name.length; j++)
				next.push(
					Math.min(
						(next[j] ?? 0) + 1,
						(row[j + 1] ?? 0) + 1,
						(row[j] ?? 0) + (input[i] === name[j] ? 0 : 1),
					),
				);
			row = next;
		}
		const current = row[name.length] ?? 3;
		if (current < distance) {
			best = name;
			distance = current;
		}
	}
	return best;
}
