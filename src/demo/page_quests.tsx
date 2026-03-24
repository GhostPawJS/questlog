import { useCallback, useMemo, useState } from 'preact/hooks';
import { inspectQuestlogItemToolHandler } from '../tools/inspect_questlog_item_tool.ts';
import type { ReviewQuestlogToolView } from '../tools/review_questlog_tool.ts';
import { reviewQuestlogToolHandler } from '../tools/review_questlog_tool.ts';
import { rewardWorkToolHandler } from '../tools/reward_work_tool.ts';
import { runQuestToolHandler } from '../tools/run_quest_tool.ts';
import { shapeWorkToolHandler } from '../tools/shape_work_tool.ts';
import { useQuestlog } from './context.ts';
import { QuestMarker } from './marker.tsx';
import {
	Badge,
	DataRow,
	EmptyState,
	Explainer,
	FormField,
	formatDuration,
	Panel,
	relativeTime,
	TabBar,
} from './ui.tsx';

const tabs = [
	{ id: 'available', label: 'Available' },
	{ id: 'in_progress', label: 'In Progress' },
	{ id: 'blocked', label: 'Blocked' },
	{ id: 'overdue', label: 'Overdue' },
	{ id: 'resolved', label: 'Resolved' },
	{ id: 'all', label: 'All' },
] as const;

const tabViewMap: Record<string, ReviewQuestlogToolView> = {
	available: 'quests.available',
	in_progress: 'quests.in_progress',
	blocked: 'quests.blocked',
	overdue: 'quests.overdue',
	resolved: 'quests.resolved',
	all: 'quests.open',
};

export function QuestsPage() {
	const { db, revision, mutate, toast } = useQuestlog();

	const [activeTab, setActiveTab] = useState('available');
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [formTitle, setFormTitle] = useState('');
	const [formObjective, setFormObjective] = useState('');
	const [formTags, setFormTags] = useState('');

	const currentView = tabViewMap[activeTab] ?? 'quests.available';

	const items = useMemo(() => {
		const result = reviewQuestlogToolHandler(db, { view: currentView });
		if (!result.ok) return [];
		return result.data.items;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [db, currentView, revision]);

	const detail = useMemo(() => {
		if (selectedId == null) return null;
		const result = inspectQuestlogItemToolHandler(db, {
			target: { kind: 'quest', id: selectedId },
			detailLevel: 'full',
		});
		if (!result.ok) return null;
		if (result.data.item.kind !== 'quest') return null;
		return result.data.item.detail as {
			id: number;
			title: string;
			objective: string;
			state: string;
			// biome-ignore lint/suspicious/noExplicitAny: demo code
			markerId: any;
			available: boolean;
			tagNames: string[];
			rewards: Array<{ id: number; kind: string; name: string; claimedAt: number | null }>;
			effortSeconds: number | null;
			estimateSeconds: number | null;
			startedAt: number | null;
			resolvedAt: number | null;
			dueAt: number | null;
			effectiveDueAt: number | null;
			questlineId: number | null;
			outcome: string | null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [db, selectedId, revision]);

	const handleStart = useCallback(() => {
		if (selectedId == null) return;
		const result = runQuestToolHandler(db, { action: 'start', questId: selectedId });
		toast({ ok: result.ok, title: result.summary });
		mutate();
	}, [db, selectedId, toast, mutate]);

	const handleFinish = useCallback(() => {
		if (selectedId == null) return;
		const result = runQuestToolHandler(db, {
			action: 'finish',
			questId: selectedId,
			outcome: 'Completed.',
		});
		toast({ ok: result.ok, title: result.summary });
		mutate();
	}, [db, selectedId, toast, mutate]);

	const handleLogEffort = useCallback(() => {
		if (selectedId == null) return;
		const result = runQuestToolHandler(db, {
			action: 'log_effort',
			questId: selectedId,
			effortSeconds: 3600,
		});
		toast({ ok: result.ok, title: result.summary });
		mutate();
	}, [db, selectedId, toast, mutate]);

	const handleAbandon = useCallback(() => {
		if (selectedId == null) return;
		const result = runQuestToolHandler(db, {
			action: 'abandon',
			questId: selectedId,
			outcome: 'Abandoned from demo.',
		});
		toast({ ok: result.ok, title: result.summary });
		mutate();
	}, [db, selectedId, toast, mutate]);

	const handleClaimRewards = useCallback(() => {
		if (detail == null) return;
		const unclaimed = detail.rewards.filter((r) => r.claimedAt == null);
		for (const reward of unclaimed) {
			const result = rewardWorkToolHandler(db, {
				action: 'claim',
				target: { kind: 'reward', id: reward.id },
			});
			toast({ ok: result.ok, title: result.summary });
		}
		mutate();
	}, [db, detail, toast, mutate]);

	const handleCreate = useCallback(() => {
		const tags = formTags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		const result = shapeWorkToolHandler(db, {
			action: 'create_quest',
			quest: { title: formTitle, objective: formObjective, tags },
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) {
			setFormTitle('');
			setFormObjective('');
			setFormTags('');
		}
		mutate();
	}, [db, formTitle, formObjective, formTags, toast, mutate]);

	const isOverdueView = activeTab === 'overdue';

	return (
		<div class="page-grid two">
			<div>
				<TabBar
					tabs={[...tabs]}
					active={activeTab}
					onChange={(id) => {
						setActiveTab(id);
						setSelectedId(null);
					}}
				/>

				{items.length === 0 ? (
					<EmptyState message="No quests in this view." />
				) : (
					<div class="list">
						{items.map((item) => (
							<button
								type="button"
								key={item.id}
								class={`list-item ${selectedId === item.id ? 'active' : ''}`}
								onClick={() => setSelectedId(item.id)}
							>
								<QuestMarker markerId={item.markerId ?? null} size="sm" />
								<div class="list-item-body">
									<strong>{item.title}</strong>
									<small>
										{item.state && <Badge label={item.state} variant="state" />}{' '}
										{item.dueAt != null && (
											<span style={isOverdueView ? { color: 'var(--danger)' } : undefined}>
												{relativeTime(item.dueAt)}
											</span>
										)}
									</small>
								</div>
							</button>
						))}
					</div>
				)}

				<Explainer title="Create Quest">
					<div style={{ display: createOpen ? 'block' : 'none' }}>
						<FormField label="Title" htmlFor="quest-title" required>
							<input
								id="quest-title"
								type="text"
								value={formTitle}
								onInput={(e) => setFormTitle((e.target as HTMLInputElement).value)}
							/>
						</FormField>
						<FormField label="Objective" htmlFor="quest-objective" required>
							<textarea
								id="quest-objective"
								value={formObjective}
								onInput={(e) => setFormObjective((e.target as HTMLTextAreaElement).value)}
							/>
						</FormField>
						<FormField label="Tags" htmlFor="quest-tags" hint="Comma-separated">
							<input
								id="quest-tags"
								type="text"
								value={formTags}
								onInput={(e) => setFormTags((e.target as HTMLInputElement).value)}
							/>
						</FormField>
						<button
							type="button"
							class="button primary"
							style={{ marginTop: '10px' }}
							disabled={!formTitle || !formObjective}
							onClick={handleCreate}
						>
							Create Quest
						</button>
					</div>
					{!createOpen && (
						<button type="button" class="button secondary" onClick={() => setCreateOpen(true)}>
							New Quest…
						</button>
					)}
				</Explainer>
			</div>

			<div>
				{detail == null ? (
					<EmptyState message="Select a quest to view details." />
				) : (
					<Panel title={detail.title}>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}
						>
							<QuestMarker markerId={detail.markerId} size="md" />
							<Badge label={detail.state} variant="state" />
						</div>

						{detail.objective && (
							<p class="muted" style={{ marginBottom: '12px' }}>
								{detail.objective}
							</p>
						)}

						<div class="data-rows">
							<DataRow label="Started">
								{detail.startedAt != null ? relativeTime(detail.startedAt) : '—'}
							</DataRow>
							<DataRow label="Resolved">
								{detail.resolvedAt != null ? relativeTime(detail.resolvedAt) : '—'}
							</DataRow>
							<DataRow label="Due">
								{detail.dueAt != null ? relativeTime(detail.dueAt) : '—'}
							</DataRow>
							<DataRow label="Effort">{formatDuration(detail.effortSeconds)}</DataRow>
							<DataRow label="Estimate">{formatDuration(detail.estimateSeconds)}</DataRow>
						</div>

						{detail.tagNames.length > 0 && (
							<DataRow label="Tags">
								{detail.tagNames.map((tag) => (
									<Badge key={tag} label={tag} variant="tag" />
								))}
							</DataRow>
						)}

						{detail.rewards.length > 0 && (
							<DataRow label="Rewards">
								<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
									{detail.rewards.map((reward) => (
										<li key={reward.id}>
											<strong>{reward.name}</strong> <Badge label={reward.kind} variant="entity" />{' '}
											{reward.claimedAt != null ? (
												<Badge label="Claimed" variant="success" />
											) : (
												<Badge label="Unclaimed" variant="warning" />
											)}
										</li>
									))}
								</ul>
							</DataRow>
						)}

						<div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
							{(detail.state === 'available' || detail.state === 'open') && (
								<button type="button" class="button primary" onClick={handleStart}>
									Start Quest
								</button>
							)}
							{detail.state === 'in_progress' && (
								<>
									<button type="button" class="button primary" onClick={handleFinish}>
										Finish Quest
									</button>
									<button type="button" class="button secondary" onClick={handleLogEffort}>
										Log 1h Effort
									</button>
									<button type="button" class="button danger" onClick={handleAbandon}>
										Abandon
									</button>
								</>
							)}
							{(detail.state === 'done' || detail.state === 'abandoned') &&
								detail.rewards.length > 0 &&
								detail.rewards.some((r) => r.claimedAt == null) && (
									<button type="button" class="button primary" onClick={handleClaimRewards}>
										Claim Reward
									</button>
								)}
						</div>
					</Panel>
				)}
			</div>
		</div>
	);
}
