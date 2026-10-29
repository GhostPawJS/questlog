const isTime = (key: string, value: unknown): value is number | string =>
	/(At|Wake)$/.test(key) &&
	(typeof value === 'number' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) &&
	Number.isFinite(new Date(value).getTime());

function scalar(key: string, value: unknown): string {
	if (value == null || value === '') return '-';
	if (isTime(key, value)) return new Date(value).toLocaleString('en-GB', { timeZoneName: 'short' });
	return String(value).replace(/[\r\n]+/g, ' ');
}

function lines(value: unknown, indent: string, key = ''): string[] {
	if (Array.isArray(value)) {
		if (!value.length) return [`${indent}none`];
		if (value.every((item) => item === null || typeof item !== 'object'))
			return [`${indent}${value.map((item) => scalar(key, item)).join(', ')}`];
		return value.flatMap((item, index) => [...(index ? [''] : []), ...lines(item, indent, key)]);
	}
	if (value !== null && typeof value === 'object') {
		const out: string[] = [];
		for (const [name, item] of Object.entries(value)) {
			if (item !== null && typeof item === 'object') {
				const nested = lines(item, `${indent}  `, name);
				if (Array.isArray(item) && nested.length === 1)
					out.push(`${indent}${name}: ${nested[0]?.trim()}`);
				else out.push(`${indent}${name}:`, ...nested);
			} else out.push(`${indent}${name}: ${scalar(name, item)}`);
		}
		return out.length ? out : [`${indent}-`];
	}
	return [`${indent}${scalar(key, value)}`];
}

/** Render structured results as readable text without changing JSON output. */
export function textOutput(value: unknown): string {
	if (value == null) return '-';
	if (Array.isArray(value) && !value.length) return 'None';
	return lines(value, '').join('\n');
}
