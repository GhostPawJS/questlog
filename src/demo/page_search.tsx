import { useState } from 'preact/hooks';
import type { SearchQuestlogToolResult } from '../tools/search_questlog_tool.ts';
import { searchQuestlogToolHandler } from '../tools/search_questlog_tool.ts';
import { navigate } from './app.tsx';
import { useQuestlog } from './context.ts';
import { QuestMarker } from './marker.tsx';
import { Badge, EmptyState, Panel } from './ui.tsx';

const SUGGESTED = ['launch', 'QA', 'press', 'NFT', 'playtest'] as const;

export function SearchPage() {
	const { db } = useQuestlog();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchQuestlogToolResult | null>(null);

	function runSearch(q: string) {
		setQuery(q);
		if (!q.trim()) {
			setResults(null);
			return;
		}
		setResults(searchQuestlogToolHandler(db, { query: q }));
	}

	function onSubmit(e: Event) {
		e.preventDefault();
		runSearch(query);
	}

	return (
		<div class="page-search">
			<Panel title="Search Questlog" subtitle="Full-text search across all quests and rumors.">
				<form
					class="search-form"
					onSubmit={onSubmit}
					style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
				>
					<input
						id="search-input"
						type="text"
						placeholder="Search quests and rumors..."
						style={{ fontSize: '1rem', flex: 1 }}
						value={query}
						onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
					/>
					<button type="submit" class="button primary">
						Search
					</button>
				</form>

				<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
					{SUGGESTED.map((term) => (
						<button
							key={term}
							type="button"
							class="button sm ghost"
							onClick={() => runSearch(term)}
						>
							{term}
						</button>
					))}
				</div>
			</Panel>

			{results === null ? (
				<EmptyState message="Type a query to search across all quests and rumors." />
			) : !results.ok ? (
				<Panel title="Search Problem">
					<p class="warning">{results.summary}</p>
				</Panel>
			) : results.data.items.length === 0 ? (
				<EmptyState message="No results found." />
			) : (
				<Panel title={`${results.data.returnedCount} results found`}>
					<div class="list">
						{results.data.items.map((item) => (
							<button
								type="button"
								key={`${item.kind}-${item.id}`}
								class="list-item"
								onClick={() => navigate(item.kind === 'quest' ? '/quests' : '/intake')}
							>
								<QuestMarker markerId={item.markerId ?? null} size="sm" />
								<div class="list-item-body">
									<strong>{item.title}</strong>
									{item.snippet && <small>{item.snippet}</small>}
								</div>
								<Badge label={item.kind} variant="entity" />
							</button>
						))}
					</div>
				</Panel>
			)}
		</div>
	);
}
