import { isSea } from 'node:sea';

let npmEntry = false;

export function markNpmEntry(): void {
	npmEntry = true;
}

export function cliVersion(
	version: string,
	{
		sea = isSea,
		npm = npmEntry,
		platform = process.platform,
		arch = process.arch,
		args = [],
	}: { sea?: () => boolean; npm?: boolean; platform?: string; arch?: string; args?: string[] } = {},
): string {
	let binary = false;
	try {
		binary = sea();
	} catch {
		// Unavailable SEA detection uses the entry variant.
	}
	const target = `${platform === 'win32' ? 'windows' : platform}-${arch}`;
	const variant = binary ? 'binary' : npm ? 'npm' : 'library';
	if (args.includes('--json'))
		return JSON.stringify({ name: 'questlog', version, variant, target });
	if (args.includes('--short')) return version;
	return `questlog ${version} (${binary ? `binary, ${target}` : npm ? 'npm' : 'library'})`;
}
