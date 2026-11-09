import type { QuestlogDb } from '../database.ts';
import { validateTimeZone } from '../repeatable_quests/time_zone.ts';
import type { PlainCliCommand } from '../surfaces/cli.ts';
import type { CliArgument } from '../surfaces/cli_args.ts';
import { CliUsageError, parseCliArgs } from '../surfaces/cli_args.ts';
import { inspectQuestlogItemTool } from '../tools/inspect_questlog_item_tool.ts';
import { reviewQuestlogTool } from '../tools/review_questlog_tool.ts';
import { formatPlainDate, parsePlainDue } from './plain_dates.ts';
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
		description: 'Maximum displayed items or search matches.',
	};
	const id: CliArgument = { name: 'id', type: 'integer', required: true };
	const timestamp = (raw: unknown): number => {
		const text = String(raw);
		const value = /^-?\d+$/.test(text) ? Number(text) : Date.parse(text);
		if (!Number.isSafeInteger(value) || value < 1e12)
			throw new CliUsageError(
				'Pass an ISO timestamp or integer epoch milliseconds (at least 1e12), not seconds.',
			);
		return value;
	};
	const at: CliArgument = {
		name: 'at',
		type: 'string',
		description: 'Actual event time: ISO or epoch milliseconds.',
	};
	const views = reviewQuestlogTool.inputSchema.properties?.view?.enum ?? [];
	const commands: PlainCliCommand<QuestlogDb>[] = [
		{
			spec: {
				command: 'due',
				description: 'Select due work; optionally claim per consumer or release a claim.',
				flags: [
					{
						name: 'within',
						type: 'string',
						description: 'Duration (15m, 2h, 1d, 7d); default 0m.',
					},
					{ name: 'tag', type: 'array', description: 'Require every tag.' },
					limit,
					{ name: 'claim', type: 'string', description: 'Consumer name for idempotent claims.' },
					{
						name: 'release',
						type: 'string',
						description:
							'Quest id or occurrence:<repeatableId>:<epoch milliseconds>; requires --claim.',
					},
				],
			},
			tool: 'due',
			input: (v) => ({
				...(v.within === undefined ? {} : { within: v.within }),
				...(v.tag === undefined ? {} : { tags: v.tag }),
				...(v.limit === undefined ? {} : { limit: v.limit }),
				...(v.claim === undefined ? {} : { claim: v.claim }),
				...(v.release === undefined ? {} : { release: v.release }),
			}),
			render: (r) => {
				const result = r as {
					summary: string;
					data?: { items: import('../due.ts').DueItem[]; released?: boolean };
				};
				return result.data && result.data.released === undefined
					? result.data.items
							.map(
								(i) =>
									`${i.key}  ${i.overdue ? 'overdue' : 'due'}  ${formatPlainDate(i.dueAt, true)}  ${i.title.replace(/[\r\n]+/g, ' ')}${i.tags.length ? ` ${i.tags.map((tag) => `#${tag}`).join(' ')}` : ''}`,
							)
							.join('\n') + (result.data.items.length ? '\n' : '')
					: `${result.summary}\n`;
			},
		},

		{
			spec: {
				command: 'repeatable',
				description: 'Create a repeatable or revise its IANA time zone (--tz none clears).',
				positionals: [
					{ name: 'action', type: 'string', required: true, enum: ['create', 'revise'] },
					{ name: 'id', type: 'integer' },
				],
				flags: [
					{ name: 'tz', type: 'string', description: 'IANA time zone; none clears.' },
					{ name: 'title', type: 'string' },
					{ name: 'objective', type: 'string' },
					{ name: 'rrule', type: 'string' },
					{ name: 'anchor-at', type: 'string', description: 'ISO date or epoch milliseconds.' },
				],
			},
			tool: 'manage_repeatable',
			input: (v) => {
				const tz = v.tz === 'none' ? null : (v.tz as string | undefined);
				try {
					validateTimeZone(tz);
				} catch (error) {
					throw new CliUsageError(String(error));
				}
				if (v.action === 'revise') {
					if (v.id === undefined || v.tz === undefined)
						throw new CliUsageError('repeatable revise requires <id> and --tz');
					return { action: 'revise', repeatableQuestId: v.id, tz };
				}
				if (!v.title || !v.objective || !v.rrule || !v.anchorAt)
					throw new CliUsageError(
						'repeatable create requires --title, --objective, --rrule and --anchor-at',
					);
				const anchorAt = /^-?\d+$/.test(String(v.anchorAt))
					? Number(v.anchorAt)
					: Date.parse(String(v.anchorAt));
				if (!Number.isFinite(anchorAt)) throw new CliUsageError('Invalid --anchor-at timestamp');
				return {
					action: 'create',
					repeatableQuest: {
						title: v.title,
						objective: v.objective,
						rrule: v.rrule,
						anchorAt,
						...(tz === undefined ? {} : { tz }),
					},
				};
			},
			render: (r) => {
				const result = r as {
					summary: string;
					data?: { repeatableQuest?: { tz?: string | null } };
					error?: { message: string };
				};
				return result.error
					? `${result.error.message}\n`
					: `${result.summary}\ntz: ${result.data?.repeatableQuest?.tz ?? 'none'}\n`;
			},
		},
		{
			spec: {
				command: 'quest',
				description: 'Revise a quest title.',
				positionals: [{ name: 'action', type: 'string', required: true, enum: ['revise'] }, id],
				flags: [{ name: 'title', type: 'string', required: true }],
			},
			tool: 'plan_quest',
			input: (v) => {
				if (!String(v.title).trim())
					throw new CliUsageError(`Invalid title ${JSON.stringify(v.title)}: must not be empty`);
				return { action: 'revise_title', questId: v.id, title: v.title };
			},
			render: renderQuestlogPlainResult,
		},
		{
			spec: {
				command: 'tick',
				description: 'Detect events and deliver outbound webhooks once.',
				flags: [
					{ name: 'dry-run', type: 'boolean' },
					{ name: 'claim', type: 'string' },
					{ name: 'within', type: 'string' },
				],
			},
			tool: 'manage_hooks',
			input: (v) => ({
				action: 'tick',
				dry_run: v.dryRun ?? false,
				...(v.claim === undefined ? {} : { claim: v.claim }),
				...(v.within === undefined ? {} : { within: v.within }),
			}),
			render: (r, _db, values) => {
				const result = r as {
					ok: boolean;
					summary: string;
					data?: import('../hooks/types.ts').TickResult;
				};
				if (!result.ok || !result.data) return `${result.summary}\n`;
				const d = result.data;
				return `${d.dueClaimed === undefined ? '' : `${d.dueClaimed} due items claimed; `}${d.events.length} events found; ${d.sent} deliveries sent, ${d.queued} queued, ${d.retrying} retrying, ${d.failed} failed.\n${values.dryRun ? `${JSON.stringify({ events: d.events, batches: d.batches }, null, 2)}\n` : ''}`;
			},
		},
		{
			spec: {
				command: 'review',
				description: 'Review an operational view.',
				positionals: [
					{ name: 'view', type: 'string', required: true, enum: [...views, 'duplicates'] },
				],
			},
			tool: 'review_questlog',
			input: (v) => ({ view: v.view === 'duplicates' ? 'quests.duplicates' : v.view }),
			render: renderQuestlogPlainResult,
		},
		{
			spec: {
				command: 'add',
				description:
					'Create a quest: add "My title" or add --title "My title". Objective defaults to the title. Example: questlog add "Review report" --due tomorrow --tag work --tag review.',
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
					{
						name: 'created-at',
						type: 'string',
						description: 'Historical creation time: ISO or epoch milliseconds.',
					},
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
				if (v.createdAt !== undefined) quest.createdAt = timestamp(v.createdAt);
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
				description: 'Review quests and other work. Limit and offset apply to text and JSON.',
				flags: [
					{ name: 'view', type: 'string', enum: ['available', 'rumors.open', ...views] },
					{
						name: 'count',
						type: 'boolean',
						description: 'Print the filtered total before pagination; JSON: {total}.',
					},
					{ name: 'count-by', type: 'string', enum: ['tag', 'prefix'] },
					{ name: 'tag', type: 'array', description: 'Require every tag (repeatable; AND).' },
					limit,
					{ name: 'offset', type: 'integer', description: 'Skip this many items (default 0).' },
				],
			},
			transformResult: (result, values) => {
				const r = result as { ok: boolean; data?: Record<string, unknown> };
				if (!r.ok || !r.data) return result;
				const key = ['items', 'deliveries', 'groups', 'counts'].find((key) =>
					Array.isArray(r.data?.[key]),
				);
				if (!key) return result;
				const items = r.data[key] as unknown[];
				if (values.count) return { total: items.length };
				const offset = Number(values.offset ?? 0);
				const limit = Number(values.limit ?? items.length);
				return {
					...r,
					data: {
						...r.data,
						[key]: items.slice(offset, offset + limit),
						total: items.length,
						offset,
						limit,
						hasMore: offset + limit < items.length,
					},
				};
			},
			tool: 'review_questlog',
			input: (v) => {
				const view = !v.view || v.view === 'available' ? 'quests.available' : String(v.view);
				if (v.count && v.countBy) throw new CliUsageError('Use --count or --count-by separately');
				if (v.tag !== undefined && !view.startsWith('quests.'))
					throw new CliUsageError('--tag requires a quest view');
				return {
					view: view === 'rumors.open' ? 'rumors' : view,
					...(v.countBy === undefined ? {} : { countBy: v.countBy }),
					...(v.tag === undefined ? {} : { filters: { tagNames: v.tag } }),
				};
			},
			render: (result, db, values) =>
				values.count && 'total' in (result as object)
					? `${(result as { total: number }).total}\n`
					: renderQuestlogPlainResult(result, db, values),
		},
		{
			spec: {
				command: 'done',
				description: 'Finish a quest with its outcome.',
				positionals: [id],
				flags: [
					at,
					{
						name: 'outcome',
						type: 'string',
						description: "Required outcome. Example: --outcome 'Report sent'.",
					},
				],
			},
			tool: 'run_quest',
			input: (v) => ({
				action: 'finish',
				...(v.at === undefined ? {} : { resolvedAt: timestamp(v.at) }),
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
				flags: [limit, { name: 'fts', type: 'boolean', description: 'Use raw FTS5 syntax.' }],
			},
			tool: 'search_questlog',
			input: (v) => ({
				query: (v.query as string[]).join(' '),
				...(v.fts === undefined ? {} : { fts: v.fts }),
				...(v.limit === undefined ? {} : { limit: v.limit }),
			}),
			render: renderQuestlogPlainResult,
		},
		{
			spec: {
				command: 'show',
				description:
					'Inspect a quest id or kind:id using inspect_questlog_item. Kinds: quest, rumor, questline, repeatable_quest (alias repeatable). Example: show rumor:1.',
				positionals: [{ ...id, type: 'string' }],
			},
			tool: 'inspect_questlog_item',
			input: (v) => {
				const parts = String(v.id).split(':');
				const kind =
					parts.length === 1 ? 'quest' : parts[0] === 'repeatable' ? 'repeatable_quest' : parts[0];
				if (!inspectQuestlogItemTool.targetKinds.includes(String(kind)))
					throw new CliUsageError(
						`Unknown kind ${kind}; valid kinds: ${inspectQuestlogItemTool.targetKinds.join(', ')}, repeatable. Use inspect_questlog_item.`,
					);
				const value = parts.at(-1) ?? '';
				if (parts.length > 2) throw new CliUsageError(`Expected integer for id: ${v.id}`);
				const parsed = parseCliArgs([value], { command: 'show', positionals: [id] });
				return { target: { kind, id: parsed.id }, detailLevel: 'full' };
			},
			render: renderQuestlogPlainResult,
		},
		{
			spec: {
				command: 'start',
				description: 'Start a quest.',
				positionals: [id],
				flags: [
					at,
					{ name: 'force', type: 'boolean', description: 'Start despite unmet prerequisites.' },
				],
			},
			tool: 'run_quest',
			input: (v) => ({
				action: 'start',
				questId: v.id,
				...(v.at === undefined ? {} : { startedAt: timestamp(v.at) }),
				...(v.force === undefined ? {} : { force: v.force }),
			}),
			render: renderQuestlogPlainResult,
		},
	];
	return commands.map((command) => ({
		...command,
		spec: { ...command.spec, flags: [...(command.spec.flags ?? []), json] },
		input: (values) => {
			if (values.limit !== undefined && Number(values.limit) < 1)
				throw new Error(`Limit ${values.limit} must be at least 1`);
			if (values.offset !== undefined && Number(values.offset) < 0)
				throw new CliUsageError('Offset must be at least 0');
			return command.input(values);
		},
	}));
}
