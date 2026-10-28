import type { QuestlogDb } from '../database.ts';
import { listDeliveries } from '../hooks/list_deliveries.ts';
import { getQuestDetail } from '../quests/get_quest_detail.ts';
import type { ToolEntityRef, ToolResult } from '../tools/tool_types.ts';
import { formatPlainDate } from './plain_dates.ts';

export function renderQuestlogPlainResult(
	result: unknown,
	db: QuestlogDb,
	values: Record<string, unknown>,
): string {
	const r = result as ToolResult<{
		items?: ToolEntityRef[];
		deliveries?: ReturnType<typeof listDeliveries>;
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
			...('effectiveDueAt' in detail && detail.effectiveDueAt != null
				? [
						`${detail.resolvedAt == null && detail.effectiveDueAt < Date.now() ? '!overdue ' : ''}due ${formatPlainDate(detail.effectiveDueAt)}`,
					]
				: []),
			...('outcome' in detail && detail.outcome != null ? [`-> ${detail.outcome}`] : []),
		]
			.filter((v) => v != null)
			.join(' ')
			.replace(/[\r\n]+/g, ' ');
	};
	if (!r.ok)
		return r.outcome === 'needs_clarification'
			? `${r.clarification.question}\nMissing: ${r.clarification.missing.map((name) => `--${name}`).join(', ')}\n`
			: `${r.summary}\n${r.error.message}\n`;
	if (r.data.deliveries && !r.data.item)
		return `${r.data.deliveries.map((d) => `${d.id} target ${d.targetId} ${d.status} attempts ${d.attempts} HTTP ${d.httpStatus ?? '-'} next ${new Date(d.nextAttemptAt).toISOString()} events ${d.events.map((e) => e.id).join(', ')}`).join('\n') || 'No deliveries'}\n`;
	if (r.data.items) {
		const items =
			values.limit === undefined
				? r.data.items
				: r.data.items.slice(0, Math.max(0, Number(values.limit)));
		return `${items.length ? items.map(line).join('\n') : r.summary}\n`;
	}
	if (r.data.item) {
		const detail = getQuestDetail(db, r.data.item.detail.id);
		const fields: [string, unknown][] = [
			['id', detail.id],
			['title', detail.title],
			['objective', detail.objective],
			['state', detail.state],
			['tags', detail.tagNames.length ? detail.tagNames.map((tag) => `#${tag}`).join(' ') : '-'],
			['due', detail.effectiveDueAt == null ? '-' : formatPlainDate(detail.effectiveDueAt, true)],
			['created', formatPlainDate(detail.createdAt, true)],
		];
		if (detail.startedAt != null) fields.push(['started', formatPlainDate(detail.startedAt, true)]);
		if (detail.resolvedAt != null)
			fields.push([
				detail.success ? 'finished' : 'abandoned',
				formatPlainDate(detail.resolvedAt, true),
			]);
		if (detail.outcome != null) fields.push(['outcome', detail.outcome]);
		if (detail.questlineId != null) fields.push(['questline', detail.questlineId]);
		for (const delivery of listDeliveries(db, { questId: detail.id }))
			fields.push([
				'delivery',
				`${delivery.id} target ${delivery.targetId} ${delivery.status} attempts ${delivery.attempts}`,
			]);
		const width = Math.max(...fields.map(([label]) => label.length));
		return `${fields.map(([label, value]) => `${label.padEnd(width)}: ${String(value).replace(/[\r\n]+/g, ' ')}`).join('\n')}\n`;
	}
	return `${r.summary.replace(/[\r\n]+/g, ' ')}${r.data.primary ? ` (id ${r.data.primary.id})` : ''}\n`;
}
