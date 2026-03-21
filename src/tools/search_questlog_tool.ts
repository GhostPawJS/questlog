import { searchQuestlog } from '../search_questlog';
import {
	arraySchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata';
import { searchQuestlogToolName } from './tool_names';
import { inspectItemNext } from './tool_next';
import { toSearchListItem } from './tool_ref';
import { summarizeCount } from './tool_summary';
import type { ToolListItem, ToolResult } from './tool_types';
import { toolFailure, toolNeedsClarification, toolSuccess, toolWarning } from './tool_types';

export interface SearchQuestlogToolInput {
	query: string;
	limit?: number;
	kinds?: Array<'quest' | 'rumor'>;
	mode?: 'browse' | 'identify_one';
}

export interface SearchQuestlogToolData {
	items: ToolListItem[];
	returnedCount: number;
	totalCount: number;
	appliedKinds?: Array<'quest' | 'rumor'> | undefined;
	mode: 'browse' | 'identify_one';
}

export type SearchQuestlogToolResult = ToolResult<SearchQuestlogToolData>;

export function searchQuestlogToolHandler(
	db: Parameters<typeof searchQuestlog>[0],
	input: SearchQuestlogToolInput,
): SearchQuestlogToolResult {
	const query = input.query.trim();
	if (!query) {
		return toolFailure(
			'protocol',
			'invalid_input',
			'Search query is required.',
			'Provide a non-empty search query.',
		);
	}
	if (input.limit != null && input.limit < 1) {
		return toolFailure(
			'protocol',
			'invalid_input',
			'Search limit must be at least 1.',
			'Provide a positive limit when you want to cap returned matches.',
		);
	}

	const allHits = searchQuestlog(db, query);
	const filteredHits =
		input.kinds && input.kinds.length > 0
			? allHits.filter((hit) => input.kinds?.includes(hit.entityKind))
			: allHits;
	const limitedHits =
		input.limit && input.limit > 0 ? filteredHits.slice(0, input.limit) : filteredHits;
	const items = limitedHits.map(toSearchListItem);
	const mode = input.mode ?? 'browse';

	if (mode === 'identify_one' && filteredHits.length > 1) {
		return toolNeedsClarification(
			'ambiguous_target',
			`More than one item matches \`${query}\`. Which one did you mean?`,
			['query'],
			{
				entities: items.slice(0, 5).map((item) => ({
					kind: item.kind,
					id: item.id,
					title: item.title,
					markerId: item.markerId,
					state: item.state,
				})),
				options: items.slice(0, 5).map((item) => ({
					label: `${item.kind}: ${item.title ?? item.id}`,
					value: item.id,
				})),
			},
		);
	}

	const data: SearchQuestlogToolData = {
		items,
		returnedCount: items.length,
		totalCount: filteredHits.length,
		mode,
	};
	if (input.kinds && input.kinds.length > 0) {
		data.appliedKinds = input.kinds;
	}

	return toolSuccess(
		items.length === 0
			? 'No matching questlog items were found.'
			: summarizeCount(items.length, 'match'),
		data,
		{
			entities: items.map((item) => ({
				kind: item.kind,
				id: item.id,
				title: item.title,
				markerId: item.markerId,
				state: item.state,
			})),
			next:
				items.length === 1 && items[0]
					? [
							inspectItemNext({
								kind: items[0].kind,
								id: items[0].id,
								title: items[0].title,
								markerId: items[0].markerId,
								state: items[0].state,
							}),
						]
					: undefined,
			warnings:
				items.length === 0
					? [toolWarning('empty_result', 'No items matched the search query.')]
					: undefined,
		},
	);
}

export const searchQuestlogTool = defineQuestlogTool<
	SearchQuestlogToolInput,
	SearchQuestlogToolResult
>({
	name: searchQuestlogToolName,
	description:
		'Search quests and rumors by text when you need to find an existing item before inspecting or changing it.',
	whenToUse: 'Use this first when the exact quest, rumor, or id is not already known.',
	whenNotToUse: 'Do not use this when you already know the exact item id and want its full detail.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: true,
	targetKinds: ['quest', 'rumor'],
	inputDescriptions: {
		query: 'Text to search for in rumor and quest titles and body text.',
		limit: 'Maximum number of matches to return. Leave unset to return all matches.',
		kinds: 'Optional entity kinds to restrict the search to quests, rumors, or both.',
		mode: 'Use `browse` to return matches normally, or `identify_one` to ask for clarification when several matches are plausible.',
	},
	outputDescription:
		'Returns compact matching items with ids, titles, snippets, and markers, plus returned and total counts. In identify-one mode, the tool can return structured clarification instead of guessing.',
	inputSchema: objectSchema(
		{
			query: stringSchema('Text to search for in rumor and quest titles and body text.'),
			limit: integerSchema('Maximum number of matches to return.'),
			kinds: arraySchema(
				enumSchema('Optional kinds to restrict the search to.', ['quest', 'rumor']),
				'Optional entity kinds to search.',
			),
			mode: enumSchema(
				'Whether to browse results normally or ask for clarification when several matches are found.',
				['browse', 'identify_one'],
			),
		},
		['query'],
		'Search quests and rumors by text.',
	),
	handler: searchQuestlogToolHandler,
});
