import type { QuestlogDb } from '../database.ts';
import { getQuestDetail } from '../quests/get_quest_detail.ts';
import type { ToolEntityRef, ToolResult } from '../tools/tool_types.ts';

export function renderQuestlogPlainResult(
	result: unknown,
	db: QuestlogDb,
	values: Record<string, unknown>,
): string {
	const r = result as ToolResult<{
		items?: ToolEntityRef[];
		item?: { detail: ToolEntityRef };
		primary?: ToolEntityRef;
	}>;
	const line = (item: ToolEntityRef) => {
		const detail = item.kind === 'quest' ? getQuestDetail(db, item.id) : item;
		const tags = 'tagNames' in detail ? detail.tagNames : [];
		return [
			item.id,
			detail.state ?? detail.markerId ?? '-',
			detail.title,
			...tags.map((tag) => `#${tag}`),
		]
			.filter((v) => v != null)
			.join(' ')
			.replace(/[\r\n]+/g, ' ');
	};
	if (!r.ok)
		return `${r.summary}\n${r.outcome === 'needs_clarification' ? r.clarification.question : r.error.message}\n`;
	if (r.data.items) {
		const items =
			values.limit === undefined
				? r.data.items
				: r.data.items.slice(0, Math.max(0, Number(values.limit)));
		return `${items.length ? items.map(line).join('\n') : r.summary}\n`;
	}
	if (r.data.item) return `${line({ ...r.data.item.detail, kind: 'quest' })}\n`;
	return `${r.summary.replace(/[\r\n]+/g, ' ')}${r.data.primary ? ` (id ${r.data.primary.id})` : ''}\n`;
}
