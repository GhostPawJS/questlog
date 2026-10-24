import { homedir } from 'node:os';
import { join } from 'node:path';

export function resolveQuestlogDbPath(
	options: { flag?: string; env?: Record<string, string | undefined> } = {},
): string {
	return (
		options.flag ??
		((options.env ?? process.env).GHOSTPAW_QUESTLOG_DB ||
			join(homedir(), '.ghostpaw', 'questlog.db'))
	);
}
