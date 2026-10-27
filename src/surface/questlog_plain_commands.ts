import type { QuestlogDb } from '../database.ts';
import type { PlainCliCommand } from '../surfaces/cli.ts';
import { type CliArgument, CliUsageError } from '../surfaces/cli_args.ts';
import { reviewQuestlogTool } from '../tools/review_questlog_tool.ts';
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
				command: 'add',
				description: 'Create a quest. Objective defaults to the title.',
				flags: [
					{ name: 'title', type: 'string', required: true },
					{ name: 'tag', type: 'array' },
					{ name: 'objective', type: 'string' },
					{ name: 'due', type: 'string', description: 'ISO date or milliseconds since epoch.' },
					{ name: 'questline', type: 'integer' },
				],
			},
			tool: 'shape_work',
			input: (v) => {
				const quest: Record<string, unknown> = {
					title: v.title,
					objective: v.objective ?? v.title,
				};
				if (v.tag !== undefined) quest.tags = v.tag;
				if (v.questline !== undefined) quest.questlineId = v.questline;
				if (v.due !== undefined) {
					const raw = String(v.due);
					const due = /^-?\d+$/.test(raw) ? Number(raw) : Date.parse(raw);
					if (!Number.isSafeInteger(due)) throw new CliUsageError('Invalid due date');
					quest.dueAt = due;
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
						required: true,
						description: 'What the finished quest produced.',
					},
				],
			},
			tool: 'run_quest',
			input: (v) => ({
				action: 'finish',
				questId: v.id,
				outcome: v.outcome,
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
			input: (v) => ({ target: { kind: 'quest', id: v.id } }),
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
