import { useMemo, useState } from 'preact/hooks';
import { captureRumorToolHandler } from '../tools/capture_rumor_tool.ts';
import { reviewQuestlogToolHandler } from '../tools/review_questlog_tool.ts';
import { shapeWorkToolHandler } from '../tools/shape_work_tool.ts';
import { useQuestlog } from './context.ts';
import { QuestMarker } from './marker.tsx';
import { Badge, EmptyState, Explainer, FormField, Panel } from './ui.tsx';

export function IntakePage() {
	const { db, revision, mutate, toast } = useQuestlog();

	const [title, setTitle] = useState('');
	const [details, setDetails] = useState('');

	const rumors = useMemo(() => {
		const result = reviewQuestlogToolHandler(db, { view: 'rumors' });
		if (result.ok) return result.data.items;
		return [];
	}, [db, revision]);

	function handleCapture(e: Event) {
		e.preventDefault();
		const result = captureRumorToolHandler(db, {
			title,
			details: details || null,
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) {
			mutate();
			setTitle('');
			setDetails('');
		}
	}

	function handleSettle(item: (typeof rumors)[number]) {
		const result = shapeWorkToolHandler(db, {
			action: 'settle_rumor',
			rumorId: item.id,
			quests: [
				{
					title: `${item.title} (from rumor)`,
					objective: `Follow up on: ${item.title}`,
				},
			],
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) mutate();
	}

	function handleDismiss(rumorId: number) {
		const result = shapeWorkToolHandler(db, {
			action: 'dismiss_rumor',
			rumorId,
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) mutate();
	}

	function handleReopen(rumorId: number) {
		const result = shapeWorkToolHandler(db, {
			action: 'reopen_rumor',
			rumorId,
		});
		toast({ ok: result.ok, title: result.summary });
		if (result.ok) mutate();
	}

	return (
		<div class="page-grid">
			<Explainer title="Intake">
				Rumors are unverified signals — ideas, reports, requests — that haven't been committed to
				yet. Capture anything interesting, then either settle it into quests or dismiss it.
			</Explainer>

			<Panel title="Capture Rumor">
				<form onSubmit={handleCapture}>
					<FormField label="Title" htmlFor="rumor-title" required>
						<input
							id="rumor-title"
							type="text"
							value={title}
							onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
							required
						/>
					</FormField>
					<FormField label="Details" htmlFor="rumor-details">
						<textarea
							id="rumor-details"
							value={details}
							onInput={(e) => setDetails((e.target as HTMLTextAreaElement).value)}
						/>
					</FormField>
					<button type="submit" class="button primary" style={{ marginTop: '10px' }}>
						Capture
					</button>
				</form>
			</Panel>

			<Panel title="Rumors">
				{rumors.length === 0 ? (
					<EmptyState message="No rumors captured yet." />
				) : (
					<div class="list">
						{rumors.map((item) => (
							<div class="list-item" key={item.id} style={{ flexWrap: 'wrap' }}>
								<QuestMarker markerId={item.markerId ?? null} size="sm" />
								<div class="list-item-body">
									<strong>{item.title}</strong>
									{item.subtitle && <small>{item.subtitle}</small>}
								</div>
								<div class="actions">
									<Badge label={item.state ?? ''} variant="state" />
									{item.state === 'open' && (
										<>
											<button
												type="button"
												class="button sm primary"
												onClick={() => handleSettle(item)}
											>
												Settle
											</button>
											<button
												type="button"
												class="button sm danger"
												onClick={() => handleDismiss(item.id)}
											>
												Dismiss
											</button>
										</>
									)}
									{item.state === 'dismissed' && (
										<button
											type="button"
											class="button sm secondary"
											onClick={() => handleReopen(item.id)}
										>
											Reopen
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</Panel>
		</div>
	);
}
