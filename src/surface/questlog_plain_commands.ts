import type { QuestlogDb } from '../database.ts';
import type { PlainCliCommand } from '../surfaces/cli.ts';
import type { CliArgument } from '../surfaces/cli_args.ts';
import { CliUsageError } from '../surfaces/cli_args.ts';
import { reviewQuestlogTool } from '../tools/review_questlog_tool.ts';
import { parsePlainDue } from './plain_dates.ts';
import { renderQuestlogPlainResult } from './render_questlog_plain_result.ts';

export function questlogPlainCommands(): readonly PlainCliCommand<QuestlogDb>[] {
	const json: CliArgument = {
		name: 'json',
		type: 'boolean',
		description: 'Print the full tool result as JSON.',
	};
	const limit: CliArgument = {
		name: 'limit',
		type: 'integer',
		description: 'Maximum displayed items (list text) or search matches.',
	};
	const id: CliArgument = { name: 'id', type: 'integer', required: true };
	const views = reviewQuestlogTool.inputSchema.properties?.view?.enum ?? [];
	const commands: PlainCliCommand<QuestlogDb>[] = [
		{
			spec: {
				command: 'tick',
				description: 'Detect events and deliver outbound webhooks once.',
				flags: [{ name: 'dry-run', type: 'boolean' }],
			},
			tool: 'manage_hooks',
			input: (v) => ({ action: 'tick', dry_run: v.dryRun ?? false }),
			render: (r, _db, values) => {
				const result = r as {
					ok: boolean;
					summary: string;
					data?: import('../hooks/types.ts').TickResult;
				};
				if (!result.ok || !result.data) return `${result.summary}\n`;
				const d = result.data;
				return `${d.events.length} events found; ${d.sent} deliveries sent, ${d.queued} queued, ${d.retrying} retrying, ${d.failed} failed.\n${values.dryRun ? `${JSON.stringify({ events: d.events, batches: d.batches }, null, 2)}\n` : ''}`;
			},
		},
		{
			spec: {
				command: 'review',
				description: 'Review an operational view.',
				positionals: [{ name: 'view', type: 'string', required: true, enum: views }],
			},
			tool: 'review_questlog',
			input: (v) => ({ view: v.view }),
			render: renderQuestlogPlainResult,
		},
		{
			spec: {
				command: 'add',
				description:
					'Create a quest: add "My title" or add --title "My title". Objective defaults to the title.',
				positionals: [{ name: 'positionalTitle', type: 'string' }],
				flags: [
					{ name: 'title', type: 'string' },
					{ name: 'tag', type: 'array' },
					{
						name: 'objective',
						type: 'string',
						file: true,
						description: 'Quest objective text; defaults to the title.',
					},
					{
						name: 'due',
						type: 'string',
						description: 'Local date, today, tomorrow, +3d, ISO date-time or epoch milliseconds.',
					},
					{ name: 'questline', type: 'integer' },
				],
			},
			tool: 'shape_work',
			input: (v) => {
				if (v.title !== undefined && v.positionalTitle !== undefined)
					throw new CliUsageError(
						'give the title once: either as the first argument or with --title',
					);
				const title = v.positionalTitle ?? v.title;
				if (title === undefined)
					throw new CliUsageError(
						'Missing required argument: title. Example: questlog add "Write the report" --due tomorrow',
					);
				const quest: Record<string, unknown> = {
					title,
					objective: v.objective ?? title,
				};
				if (v.tag !== undefined)
					quest.tags = (v.tag as string[]).flatMap((tag) =>
						tag
							.split(',')
							.map((part) => part.trim())
							.filter(Boolean),
					);
				if (v.questline !== undefined) quest.questlineId = v.questline;
				if (v.due !== undefined) {
					quest.dueAt = parsePlainDue(String(v.due));
				}
				return { action: 'create_quest', quest };
			},
			render: renderQuestlogPlainResult,
		},
		{
			spec: {
				command: 'list',
				description:
					'Review quests and other work. Limit caps text output; JSON contains the full tool result.',
				flags: [{ name: 'view', type: 'string', enum: ['available', ...views] }, limit],
			},
			tool: 'review_questlog',
			input: (v) => ({ view: !v.view || v.view === 'available' ? 'quests.available' : v.view }),
			render: renderQuestlogPlainResult,
		},
		{
			spec: {
				command: 'done',
				description: 'Finish a quest with its outcome.',
				positionals: [id],
				flags: [
					{
						name: 'outcome',
						type: 'string',
						description: 'What the finished quest produced; asked for when omitted.',
					},
				],
			},
			tool: 'run_quest',
			input: (v) => ({
				action: 'finish',
				questId: v.id,
				...(v.outcome === undefined ? {} : { outcome: v.outcome }),
			}),
			render: renderQuestlogPlainResult,
		},
		{
			spec: {
				command: 'search',
				description: 'Search quests and rumors.',
				positionals: [{ name: 'query', type: 'string', variadic: true, required: true }],
				flags: [limit],
			},
			tool: 'search_questlog',
			input: (v) => ({
				query: (v.query as string[]).join(' '),
				...(v.limit === undefined ? {} : { limit: v.limit }),
			}),
			render: renderQuestlogPlainResult,
		},
		{
			spec: { command: 'show', description: 'Inspect a quest by id.', positionals: [id] },
			tool: 'inspect_questlog_item',
			input: (v) => ({ target: { kind: 'quest', id: v.id }, detailLevel: 'full' }),
			render: renderQuestlogPlainResult,
		},
	];
	return commands.map((command) => ({
		...command,
		spec: { ...command.spec, flags: [...(command.spec.flags ?? []), json] },
		input: (values) => {
			if (values.limit !== undefined && Number(values.limit) < 1)
				throw new Error('Limit must be at least 1');
			return command.input(values);
		},
	}));
}
