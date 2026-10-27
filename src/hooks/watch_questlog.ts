import type { QuestlogDb } from '../database.ts';
import { tickQuestlog } from './tick_questlog.ts';
import type { TickOptions, TickResult } from './types.ts';

export async function watchQuestlog(
	db: QuestlogDb,
	options: TickOptions & {
		interval?: number;
		signal: AbortSignal;
		onTick?: (result: TickResult) => void;
	},
): Promise<void> {
	const interval = options.interval ?? 60;
	if (!Number.isFinite(interval) || interval < 5)
		throw new Error('Interval must be at least 5 seconds');
	while (!options.signal.aborted) {
		options.onTick?.(await tickQuestlog(db, options));
		if (options.signal.aborted) break;
		await new Promise<void>((resolve) => {
			const finish = () => {
				clearTimeout(timer);
				options.signal.removeEventListener('abort', finish);
				resolve();
			};
			const timer = setTimeout(finish, interval * 1000);
			options.signal.addEventListener('abort', finish, { once: true });
		});
	}
}
