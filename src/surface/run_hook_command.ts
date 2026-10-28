import type { Readable, Writable } from 'node:stream';
import type { QuestlogDb } from '../database.ts';
import { parseHookHeaders } from '../hooks/hook_headers.ts';
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
import { textOutput } from '../surfaces/text_output.ts';
import { withTransaction } from '../with_transaction.ts';

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
				'questlog hook add <url> [--tag name] [--events types] [--min-gap seconds] [--secret-stdin] [--header "Name: value"] [--header-stdin] [--json]\nquestlog hook list|remove <id>|test <id>|label [name]\nquestlog watch [--interval seconds] [--json]\n',
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
							{ name: 'header', type: 'array' as const },
							{ name: 'header-stdin', type: 'boolean' as const },
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
			throw new Error(`--interval ${values.interval} is below the minimum of 5 seconds`);
		db = await open();
		let result: unknown;
		switch (action) {
			case 'add': {
				let secret: string | undefined;
				if (values.secretStdin && values.headerStdin)
					throw new Error('Use --secret-stdin and --header-stdin separately');
				const headerLines = (values.header ?? []) as string[];
				if (values.headerStdin) {
					let raw = '';
					for await (const chunk of io.stdin) raw += String(chunk);
					headerLines.push(...raw.split(/\r?\n/).filter(Boolean));
				}
				const headers = parseHookHeaders(headerLines);
				if (values.secretStdin) {
					secret = '';
					for await (const chunk of io.stdin) secret += String(chunk);
					secret = secret.replace(/\r?\n$/, '');
				}
				result = withTransaction(db, () => {
					const created = addHook(db as QuestlogDb, {
						url: String(values.url),
						...(values.tag === undefined ? {} : { tag: String(values.tag) }),
						...(values.events === undefined
							? {}
							: { events: String(values.events).split(',') as HookEventType[] }),
						...(values.minGap === undefined ? {} : { minGap: Number(values.minGap) }),
						...(secret === undefined ? {} : { secret }),
					});
					(db as QuestlogDb)
						.prepare('UPDATE hook_targets SET headers = ? WHERE id = ?')
						.run(JSON.stringify(headers), created.id);
					return created;
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
				if (!listHooks(db).some((hook) => hook.id === Number(values.id))) {
					io.stderr.write(`Hook ${values.id} not found\n`);
					return 3;
				}
				removeHook(db, Number(values.id));
				result = { removed: Number(values.id) };
				break;
			case 'test':
				if (!listHooks(db).some((hook) => hook.id === Number(values.id))) {
					io.stderr.write(`Hook ${values.id} not found\n`);
					return 3;
				}
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
						onTick: (tick) =>
							io.stdout.write(
								values.json
									? `${JSON.stringify(tick)}\n`
									: `${tick.events.length} events; ${tick.sent} sent, ${tick.queued} queued, ${tick.retrying} retrying, ${tick.failed} failed\n`,
							),
					});
				} finally {
					process.off('SIGINT', stop);
					process.off('SIGTERM', stop);
				}
				return 0;
			}
		}
		io.stdout.write(
			values.json
				? `${JSON.stringify(result, null, 2)}\n`
				: action === 'add'
					? `Created hook ${(result as { id: number }).id}\nSecret (shown once): ${(result as { secret: string }).secret}\n`
					: `${textOutput(result)}\n`,
		);
		return 0;
	} catch (error) {
		// Input and transport errors must never echo a supplied secret or URL credentials.
		const message = error instanceof Error ? error.message : '';
		const safe =
			/^(unsupported scheme |URL userinfo |unknown event |--interval |Invalid header |Reserved header |Use --secret-stdin|Expected |Min gap |Unknown event |Hook )/.test(
				message,
			);
		io.stderr.write(
			`${safe ? message : 'Invalid webhook command or unavailable target. Run questlog hook --help.'}\n`,
		);
		return 2;
	} finally {
		db?.close();
	}
}
