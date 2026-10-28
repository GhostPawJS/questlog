/** Validate without including header values in diagnostics. */
export function parseHookHeaders(lines: string[]): Record<string, string> {
	const headers: Record<string, string> = Object.create(null);
	for (const line of lines) {
		const colon = line.indexOf(':');
		const name = line.slice(0, colon).trim().toLowerCase();
		if (colon < 1 || !/^[!#$%&'*+.^_`|~0-9a-z-]+$/.test(name))
			throw new Error('Invalid header name; use Name: value');
		if (['host', 'content-length', 'content-type'].includes(name) || name.startsWith('x-questlog-'))
			throw new Error(`Reserved header name: ${name}`);
		const value = line.slice(colon + 1).trim();
		if (/[\r\n\0]/.test(value)) throw new Error('Invalid header value');
		headers[name] = value;
	}
	return headers;
}
