import { useMemo } from 'preact/hooks';
import { reviewQuestlogToolHandler } from '../tools/review_questlog_tool.ts';
import { navigate } from './app.tsx';
import { useQuestlog } from './context.ts';
import { QuestMarker } from './marker.tsx';
import { Badge, EmptyState, Panel, SummaryCard } from './ui.tsx';

function queryView(db: Parameters<typeof reviewQuestlogToolHandler>[0], view: string) {
	// biome-ignore lint/suspicious/noExplicitAny: demo code
	const result = reviewQuestlogToolHandler(db, { view: view as any });
	if (result.ok) return result.data;
	// biome-ignore lint/suspicious/noExplicitAny: demo code
	return { items: [] as any[], count: 0 };
}

const markerDefs: Array<{
	markerId:
		| 'attention.available'
		| 'attention.available.repeatable'
		| 'attention.available.future'
		| 'progress.incomplete'
		| 'progress.complete';
	label: string;
}> = [
	{ markerId: 'attention.available', label: 'Available' },
	{ markerId: 'attention.available.repeatable', label: 'Repeatable' },
	{ markerId: 'attention.available.future', label: 'Future' },
	{ markerId: 'progress.incomplete', label: 'Incomplete' },
	{ markerId: 'progress.complete', label: 'Turn-in' },
];

export function DashboardPage() {
	const { db, revision } = useQuestlog();

	const data = useMemo(() => {
		const open = queryView(db, 'quests.open');
		const available = queryView(db, 'quests.available');
		const inProgress = queryView(db, 'quests.in_progress');
		const overdue = queryView(db, 'quests.overdue');
		const rumors = queryView(db, 'rumors');
		const deferred = queryView(db, 'quests.deferred');
		const blocked = queryView(db, 'quests.blocked');
		const resolved = queryView(db, 'quests.resolved');
		const questlines = queryView(db, 'questlines');

		const pendingRumors = rumors.items.filter(
			// biome-ignore lint/suspicious/noExplicitAny: demo code
			(r: any) => r.state !== 'dismissed' && r.state !== 'settled',
		);

		const repeatableCount = available.items.filter(
			// biome-ignore lint/suspicious/noExplicitAny: demo code
			(q: any) => q.markerId === 'attention.available.repeatable',
		).length;

		const markerCounts: Record<string, number> = {
			'attention.available': available.count,
			'attention.available.repeatable': repeatableCount,
			'attention.available.future': deferred.count,
			'progress.incomplete': inProgress.count + blocked.count,
			'progress.complete': resolved.count,
		};

		return {
			open,
			available,
			inProgress,
			overdue,
			pendingRumors,
			questlines,
			markerCounts,
		};
	}, [db, revision]);

	return (
		<div class="page-dashboard">
			<h1 class="page-heading">Mission Control</h1>

			<div class="summary-grid">
				<SummaryCard label="Total Open" value={data.open.count} />
				<SummaryCard label="Available" value={data.available.count} />
				<SummaryCard label="In Progress" value={data.inProgress.count} />
				<SummaryCard label="Overdue" value={data.overdue.count} />
				<SummaryCard label="Pending Rumors" value={data.pendingRumors.length} />
			</div>

			<Panel title="Active Markers">
				<div
					class="marker-overview-grid"
					style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;padding:20px 0;text-align:center"
				>
					{markerDefs.map((def) => (
						<div
							key={def.markerId}
							style="display:flex;flex-direction:column;align-items:center;gap:8px"
						>
							<QuestMarker markerId={def.markerId} size="lg" />
							<span style="font-size:0.85rem">{def.label}</span>
							<Badge label={String(data.markerCounts[def.markerId] ?? 0)} variant="info" />
						</div>
					))}
				</div>
			</Panel>

			<Panel title="Quick Actions">
				<div style="display:flex;gap:12px;flex-wrap:wrap">
					<button type="button" class="button secondary" onClick={() => navigate('/intake')}>
						Capture Rumor
					</button>
					<button type="button" class="button secondary" onClick={() => navigate('/quests')}>
						View Available Quests
					</button>
					<button type="button" class="button secondary" onClick={() => navigate('/search')}>
						Search Questlog
					</button>
				</div>
			</Panel>

			<Panel title="Questlines">
				{data.questlines.items.length === 0 ? (
					<EmptyState
						message="No questlines yet."
						actionLabel="Go to Planning"
						onAction={() => navigate('/planning')}
					/>
				) : (
					<div class="list">
						{data.questlines.items.map(
							// biome-ignore lint/suspicious/noExplicitAny: demo code
							(item: any) => (
								<button
									type="button"
									key={item.id}
									class="list-item"
									onClick={() => navigate('/planning')}
								>
									<div class="list-item-body">
										<strong>{item.title}</strong>
										{item.subtitle && <small>{item.subtitle}</small>}
									</div>
									{item.state && <Badge label={item.state} variant="state" />}
								</button>
							),
						)}
					</div>
				)}
			</Panel>
		</div>
	);
}
