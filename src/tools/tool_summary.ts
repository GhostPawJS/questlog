export function summarizeCount(count: number, singular: string, plural = `${singular}s`): string {
	if (count === 1) {
		return `Found 1 ${singular}.`;
	}
	return `Found ${count} ${plural}.`;
}

export function summarizeCreated(label: string, title?: string): string {
	return title ? `Created ${label} \`${title}\`.` : `Created ${label}.`;
}

export function summarizeUpdated(label: string, title?: string): string {
	return title ? `Updated ${label} \`${title}\`.` : `Updated ${label}.`;
}

export function summarizeNoOp(message: string): string {
	return message;
}

export function summarizeHidden(label: string, title?: string): string {
	return title ? `Hid ${label} \`${title}\`.` : `Hid ${label}.`;
}
