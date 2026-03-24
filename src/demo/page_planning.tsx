import { useMemo, useState } from 'preact/hooks';
import { inspectQuestlogItemToolHandler } from '../tools/inspect_questlog_item_tool.ts';
import { manageRepeatableToolHandler } from '../tools/manage_repeatable_tool.ts';
import { organizeWorkToolHandler } from '../tools/organize_work_tool.ts';
import { reviewQuestlogToolHandler } from '../tools/review_questlog_tool.ts';
import { shapeWorkToolHandler } from '../tools/shape_work_tool.ts';
import { useQuestlog } from './context.ts';
import { QuestMarker } from './marker.tsx';
import { Badge, DataRow, EmptyState, Explainer, FormField, Panel, relativeTime } from './ui.tsx';

interface QuestlineFullDetail {
	id: number;
	title: string;
	description: string | null;
	dueAt: number | null;
	startsAt: number | null;
	archivedAt: number | null;
	createdAt: number;
	updatedAt: number;
	sourceRumorId: number | null;
	totalQuests: number;
	openQuests: number;
	inProgressQuests: number;
	doneQuests: number;
	abandonedQuests: number;
	availableQuests: number;
	overdueQuests: number;
}

export function PlanningPage() {
	const { db, revision, mutate, toast } = useQuestlog();

	return (
		<div class="page-grid">
			<QuestlinesSection db={db} revision={revision} mutate={mutate} toast={toast} />
			<RepeatablesSection db={db} revision={revision} mutate={mutate} toast={toast} />
			<UnlocksSection db={db} mutate={mutate} toast={toast} />
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Questlines                                                        */
/* ------------------------------------------------------------------ */

function QuestlinesSection({
	db,
	revision,
	mutate,
	toast,
}: {
	db: ReturnType<typeof useQuestlog>['db'];
	revision: number;
	mutate: () => void;
	toast: ReturnType<typeof useQuestlog>['toast'];
}) {
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const questlines = useMemo(() => {
		const result = reviewQuestlogToolHandler(db, { view: 'questlines' });
		return result.ok ? result.data.items : [];
	}, [db, revision]);

	return (
		<Panel title="Questlines">
			{questlines.length === 0 ? (
				<EmptyState message="No questlines yet." />
			) : (
				<div class="list">
					{questlines.map((ql) => (
						<button
							key={ql.id}
							type="button"
							class={`list-item${selectedId === ql.id ? ' active' : ''}`}
							onClick={() => setSelectedId(selectedId === ql.id ? null : ql.id)}
						>
							<div class="list-item-body">
								<strong>{ql.title ?? `Questline #${ql.id}`}</strong>
								{ql.subtitle && <small>{ql.subtitle}</small>}
							</div>
						</button>
					))}
				</div>
			)}

			{selectedId != null && (
				<QuestlineDetail db={db} revision={revision} questlineId={selectedId} />
			)}

			<QuestlineCreateForm db={db} mutate={mutate} toast={toast} />
		</Panel>
	);
}

function QuestlineDetail({
	db,
	revision,
	questlineId,
}: {
	db: ReturnType<typeof useQuestlog>['db'];
	revision: number;
	questlineId: number;
}) {
	const detail = useMemo(() => {
		const result = inspectQuestlogItemToolHandler(db, {
			target: { kind: 'questline', id: questlineId },
			detailLevel: 'full',
		});
		if (!result.ok) return null;
		const item = result.data.item;
		if (item.kind !== 'questline') return null;
		return item.detail as QuestlineFullDetail;
	}, [db, revision, questlineId]);

	const memberQuests = useMemo(() => {
		const result = reviewQuestlogToolHandler(db, {
			view: 'quests.open',
			filters: { questlineId },
		});
		return result.ok ? result.data.items : [];
	}, [db, revision, questlineId]);

	if (!detail) return null;

	return (
		<div class="questline-detail">
			<h3>{detail.title}</h3>
			{detail.description && <p class="muted">{detail.description}</p>}

			<div class="data-rows">
				{detail.dueAt != null && <DataRow label="Due">{relativeTime(detail.dueAt)}</DataRow>}
				<DataRow label="Total Quests">{detail.totalQuests}</DataRow>
				<DataRow label="Open">{detail.openQuests}</DataRow>
				<DataRow label="In Progress">{detail.inProgressQuests}</DataRow>
				<DataRow label="Done">{detail.doneQuests}</DataRow>
				<DataRow label="Abandoned">{detail.abandonedQuests}</DataRow>
			</div>

			{memberQuests.length > 0 && (
				<div class="list" style={{ marginTop: '0.5rem' }}>
					{memberQuests.map((q) => (
						<div key={q.id} class="list-item">
							<QuestMarker markerId={q.markerId ?? null} size="sm" />
							<div class="list-item-body">
								<strong>{q.title ?? `Quest #${q.id}`}</strong>
							</div>
							{q.state && <Badge label={q.state} variant="state" />}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function QuestlineCreateForm({
	db,
	mutate,
	toast,
}: {
	db: ReturnType<typeof useQuestlog>['db'];
	mutate: () => void;
	toast: ReturnType<typeof useQuestlog>['toast'];
}) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmedTitle = title.trim();
		if (!trimmedTitle) return;

		const result = shapeWorkToolHandler(db, {
			action: 'create_questline',
			questline: {
				title: trimmedTitle,
				description: description.trim() || null,
			},
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) {
			setTitle('');
			setDescription('');
			mutate();
		}
	}

	return (
		<form class="form" onSubmit={handleSubmit}>
			<h4>Create Questline</h4>
			<FormField label="Title" htmlFor="ql-title" required>
				<input
					id="ql-title"
					type="text"
					value={title}
					onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
					placeholder="Questline title"
					required
				/>
			</FormField>
			<FormField label="Description" htmlFor="ql-desc">
				<textarea
					id="ql-desc"
					value={description}
					onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
					placeholder="Optional description"
					rows={2}
				/>
			</FormField>
			<button type="submit" class="button primary" style={{ marginTop: '10px' }}>
				Create Questline
			</button>
		</form>
	);
}

/* ------------------------------------------------------------------ */
/*  Repeatables                                                       */
/* ------------------------------------------------------------------ */

function RepeatablesSection({
	db,
	revision,
	mutate,
	toast,
}: {
	db: ReturnType<typeof useQuestlog>['db'];
	revision: number;
	mutate: () => void;
	toast: ReturnType<typeof useQuestlog>['toast'];
}) {
	const anchors = useMemo(() => {
		const result = reviewQuestlogToolHandler(db, { view: 'repeatables.due_anchors' });
		return result.ok ? result.data.items : [];
	}, [db, revision]);

	function handleSpawnDue() {
		const result = manageRepeatableToolHandler(db, {
			action: 'spawn_due',
			now: Date.now(),
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) mutate();
	}

	return (
		<Panel
			title="Repeatable Quests"
			actions={
				<button type="button" class="button primary" onClick={handleSpawnDue}>
					Spawn Due
				</button>
			}
		>
			{anchors.length === 0 ? (
				<EmptyState message="No due repeatable anchors." />
			) : (
				<div class="list">
					{anchors.map((anchor) => (
						<div key={`${anchor.id}-${anchor.dueAt}`} class="list-item">
							<QuestMarker markerId={anchor.markerId ?? null} size="sm" />
							<div class="list-item-body">
								<strong>{anchor.title ?? `Repeatable #${anchor.id}`}</strong>
								{anchor.subtitle && <small>{anchor.subtitle}</small>}
							</div>
						</div>
					))}
				</div>
			)}

			<RepeatableCreateForm db={db} mutate={mutate} toast={toast} />
		</Panel>
	);
}

function RepeatableCreateForm({
	db,
	mutate,
	toast,
}: {
	db: ReturnType<typeof useQuestlog>['db'];
	mutate: () => void;
	toast: ReturnType<typeof useQuestlog>['toast'];
}) {
	const [title, setTitle] = useState('');
	const [objective, setObjective] = useState('');
	const [rrule, setRrule] = useState('');
	const [anchorDate, setAnchorDate] = useState('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmedTitle = title.trim();
		const trimmedObjective = objective.trim();
		const trimmedRrule = rrule.trim();
		if (!trimmedTitle || !trimmedObjective || !trimmedRrule) return;

		const anchorTs = anchorDate.trim() ? new Date(anchorDate.trim()).getTime() : Date.now();

		const result = manageRepeatableToolHandler(db, {
			action: 'create',
			repeatableQuest: {
				title: trimmedTitle,
				objective: trimmedObjective,
				rrule: trimmedRrule,
				anchorAt: anchorTs,
			},
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) {
			setTitle('');
			setObjective('');
			setRrule('');
			setAnchorDate('');
			mutate();
		}
	}

	return (
		<form class="form" onSubmit={handleSubmit}>
			<h4>Create Repeatable</h4>
			<FormField label="Title" htmlFor="rp-title" required>
				<input
					id="rp-title"
					type="text"
					value={title}
					onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
					placeholder="Repeatable quest title"
					required
				/>
			</FormField>
			<FormField label="Objective" htmlFor="rp-objective" required>
				<input
					id="rp-objective"
					type="text"
					value={objective}
					onInput={(e) => setObjective((e.target as HTMLInputElement).value)}
					placeholder="What needs to be done each time"
					required
				/>
			</FormField>
			<FormField label="RRULE" htmlFor="rp-rrule" required>
				<input
					id="rp-rrule"
					type="text"
					value={rrule}
					onInput={(e) => setRrule((e.target as HTMLInputElement).value)}
					placeholder="FREQ=WEEKLY;BYDAY=MO"
					required
				/>
			</FormField>
			<FormField label="Anchor Date" htmlFor="rp-anchor" hint="Timestamp or date string">
				<input
					id="rp-anchor"
					type="text"
					value={anchorDate}
					onInput={(e) => setAnchorDate((e.target as HTMLInputElement).value)}
					placeholder="2026-01-01 or timestamp"
				/>
			</FormField>
			<button type="submit" class="button primary" style={{ marginTop: '10px' }}>
				Create Repeatable
			</button>
		</form>
	);
}

/* ------------------------------------------------------------------ */
/*  Unlocks                                                           */
/* ------------------------------------------------------------------ */

function UnlocksSection({
	db,
	mutate,
	toast,
}: {
	db: ReturnType<typeof useQuestlog>['db'];
	mutate: () => void;
	toast: ReturnType<typeof useQuestlog>['toast'];
}) {
	const [addFrom, setAddFrom] = useState('');
	const [addTo, setAddTo] = useState('');
	const [removeFrom, setRemoveFrom] = useState('');
	const [removeTo, setRemoveTo] = useState('');

	function handleAdd(e: Event) {
		e.preventDefault();
		const fromId = parseInt(addFrom, 10);
		const toId = parseInt(addTo, 10);
		if (Number.isNaN(fromId) || Number.isNaN(toId)) return;

		const result = organizeWorkToolHandler(db, {
			action: 'add_unlock',
			fromQuestId: fromId,
			toQuestId: toId,
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) {
			setAddFrom('');
			setAddTo('');
			mutate();
		}
	}

	function handleRemove(e: Event) {
		e.preventDefault();
		const fromId = parseInt(removeFrom, 10);
		const toId = parseInt(removeTo, 10);
		if (Number.isNaN(fromId) || Number.isNaN(toId)) return;

		const result = organizeWorkToolHandler(db, {
			action: 'remove_unlock',
			fromQuestId: fromId,
			toQuestId: toId,
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) {
			setRemoveFrom('');
			setRemoveTo('');
			mutate();
		}
	}

	return (
		<Panel title="Unlock Dependencies">
			<Explainer title="What are unlocks?">
				<p>
					Unlocks define prerequisite relationships between quests. A quest blocked by an unlock
					cannot be started until the prerequisite is finished.
				</p>
			</Explainer>

			<form class="form" onSubmit={handleAdd}>
				<h4>Add Unlock</h4>
				<FormField label="From Quest ID" htmlFor="unlock-add-from">
					<input
						id="unlock-add-from"
						type="number"
						value={addFrom}
						onInput={(e) => setAddFrom((e.target as HTMLInputElement).value)}
						placeholder="Prerequisite quest ID"
						required
					/>
				</FormField>
				<FormField label="To Quest ID" htmlFor="unlock-add-to">
					<input
						id="unlock-add-to"
						type="number"
						value={addTo}
						onInput={(e) => setAddTo((e.target as HTMLInputElement).value)}
						placeholder="Blocked quest ID"
						required
					/>
				</FormField>
				<button type="submit" class="button primary" style={{ marginTop: '10px' }}>
					Add Unlock
				</button>
			</form>

			<form class="form" onSubmit={handleRemove}>
				<h4>Remove Unlock</h4>
				<FormField label="From Quest ID" htmlFor="unlock-rm-from">
					<input
						id="unlock-rm-from"
						type="number"
						value={removeFrom}
						onInput={(e) => setRemoveFrom((e.target as HTMLInputElement).value)}
						placeholder="Prerequisite quest ID"
						required
					/>
				</FormField>
				<FormField label="To Quest ID" htmlFor="unlock-rm-to">
					<input
						id="unlock-rm-to"
						type="number"
						value={removeTo}
						onInput={(e) => setRemoveTo((e.target as HTMLInputElement).value)}
						placeholder="Blocked quest ID"
						required
					/>
				</FormField>
				<button type="submit" class="button danger" style={{ marginTop: '10px' }}>
					Remove Unlock
				</button>
			</form>
		</Panel>
	);
}
