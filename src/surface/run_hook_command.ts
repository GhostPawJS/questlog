import type { Readable, Writable } from 'node:stream';
import type { QuestlogDb } from '../database.ts';
import {
	addHook,
	hookLabel,
	listHooks,
	removeHook,
	testHook,
	watchQuestlog,
} from '../hooks/index.ts';
import type { HookEventType } from '../hooks/types.ts';
import { parseCliArgs } from '../surfaces/cli_args.ts';

export async function runHookCommand(
	command: string,
	args: string[],
	io: { stdin: Readable; stdout: Writable; stderr: Writable },
	open: () => Promise<QuestlogDb>,
): Promise<number> {
	let db: QuestlogDb | undefined;
	try {
		if (args.includes('--help') || args.includes('-h')) {
			io.stdout.write(
				'questlog hook add <url> [--tag name] [--events types] [--min-gap seconds] [--secret-stdin] [--json]\nquestlog hook list|remove <id>|test <id>|label [name]\nquestlog watch [--interval seconds] [--json]\n',
			);
			return 0;
		}
		const action = command === 'watch' ? 'watch' : args.shift();
		if (!['add', 'list', 'remove', 'test', 'label', 'watch'].includes(action ?? ''))
			throw new Error('Expected hook add, list, remove, test, or label');
		const values = parseCliArgs(args, {
			command,
			flags: [
				{ name: 'json', type: 'boolean' },
				...(action === 'add'
					? [
							{ name: 'tag', type: 'string' as const },
							{ name: 'events', type: 'string' as const },
							{ name: 'min-gap', type: 'integer' as const },
							{ name: 'secret-stdin', type: 'boolean' as const },
						]
					: action === 'watch'
						? [{ name: 'interval', type: 'number' as const }]
						: []),
			],
			positionals:
				action === 'add'
					? [{ name: 'url', type: 'string', required: true }]
					: ['remove', 'test'].includes(action ?? '')
						? [{ name: 'id', type: 'integer', required: true }]
						: action === 'label'
							? [{ name: 'name', type: 'string' }]
							: [],
		});
		if (action === 'watch' && values.interval !== undefined && Number(values.interval) < 5)
			throw new Error('Interval must be at least 5 seconds');
		db = await open();
		let result: unknown;
		switch (action) {
			case 'add': {
				let secret: string | undefined;
				if (values.secretStdin) {
					secret = '';
					for await (const chunk of io.stdin) secret += String(chunk);
					secret = secret.replace(/\r?\n$/, '');
				}
				result = addHook(db, {
					url: String(values.url),
					...(values.tag === undefined ? {} : { tag: String(values.tag) }),
					...(values.events === undefined
						? {}
						: { events: String(values.events).split(',') as HookEventType[] }),
					...(values.minGap === undefined ? {} : { minGap: Number(values.minGap) }),
					...(secret === undefined ? {} : { secret }),
				});
				break;
			}
			case 'list':
				result = listHooks(db);
				break;
			case 'label':
				result = { label: hookLabel(db, values.name as string | undefined) };
				break;
			case 'remove':
				removeHook(db, Number(values.id));
				result = { removed: Number(values.id) };
				break;
			case 'test':
				result = await testHook(db, Number(values.id));
				break;
			case 'watch': {
				const controller = new AbortController();
				const stop = () => controller.abort();
				process.on('SIGINT', stop);
				process.on('SIGTERM', stop);
				try {
					await watchQuestlog(db, {
						signal: controller.signal,
						interval: Number(values.interval ?? 60),
						onTick: (tick) => io.stdout.write(`${JSON.stringify(tick)}\n`),
					});
				} finally {
					process.off('SIGINT', stop);
					process.off('SIGTERM', stop);
				}
				return 0;
			}
		}
		io.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		return 0;
	} catch {
		// Input and transport errors must never echo a supplied secret or URL credentials.
		io.stderr.write('Invalid webhook command or unavailable target. Run questlog hook --help.\n');
		return 2;
	} finally {
		db?.close();
	}
}
