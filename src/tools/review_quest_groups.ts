import type { QuestDetail } from '../quests/types.ts';

export function tallyQuests(quests: QuestDetail[], by: 'tag' | 'prefix') {
	const counts = new Map<string, number>();
	for (const quest of quests) {
		const keys =
			by === 'tag'
				? quest.tagNames
				: [
						quest.title.includes(':')
							? quest.title.slice(0, quest.title.indexOf(':')).trim()
							: '(none)',
					];
		for (const key of new Set(keys)) counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return [...counts]
		.map(([key, count]) => ({ key, count }))
		.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function duplicateGroups(quests: QuestDetail[]) {
	const groups: { ids: number[]; title: string }[] = [];
	const nodes = quests.map((quest) => ({
		quest,
		text: quest.title
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s]/gu, ' ')
			.trim()
			.replace(/\s+/g, ' '),
		parent: quest.id,
	}));
	const parents = new Map(nodes.map((node) => [node.parent, node.parent]));
	const root = (id: number): number => {
		const parent = parents.get(id) ?? id;
		if (parent === id) return id;
		const result = root(parent);
		parents.set(id, result);
		return result;
	};
	const postings = new Map<string, number[]>();
	const tokens = nodes.map((node) => new Set(node.text.split(' ').filter(Boolean)));
	for (let i = 0; i < nodes.length; i++) {
		const candidates = new Set<number>();
		for (const token of tokens[i] ?? [])
			for (const j of postings.get(token) ?? []) candidates.add(j);
		// Empty normalized titles also match one another.
		if (!nodes[i]?.text) for (const j of postings.get('') ?? []) candidates.add(j);
		for (const j of candidates) {
			const a = tokens[i] ?? new Set<string>();
			const b = tokens[j] ?? new Set<string>();
			if (Math.min(a.size, b.size) < 0.85 * Math.max(a.size, b.size)) continue;
			let intersection = 0;
			for (const token of a) if (b.has(token)) intersection++;
			if (
				nodes[i]?.text === nodes[j]?.text ||
				intersection / (a.size + b.size - intersection) >= 0.85
			)
				parents.set(root(nodes[i]?.parent ?? 0), root(nodes[j]?.parent ?? 0));
		}
		for (const token of tokens[i]?.size ? (tokens[i] ?? []) : ['']) {
			const list = postings.get(token) ?? [];
			list.push(i);
			postings.set(token, list);
		}
	}
	const buckets = new Map<number, (typeof groups)[number]>();
	for (const node of nodes) {
		const key = root(node.parent);
		const group = buckets.get(key) ?? { ids: [], title: node.quest.title };
		group.ids.push(node.quest.id);
		buckets.set(key, group);
	}
	for (const group of buckets.values()) if (group.ids.length > 1) groups.push(group);
	return groups;
}
