import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { BrowserQuestlogDb } from './browser_questlog_db.ts';
import { QuestlogContext } from './context.ts';
import { createDemoSession } from './demo_session.ts';
import { DashboardPage } from './page_dashboard.tsx';
import { IntakePage } from './page_intake.tsx';
import { PlanningPage } from './page_planning.tsx';
import { QuestsPage } from './page_quests.tsx';
import { SearchPage } from './page_search.tsx';
import { ToastStack, useToastState } from './result_toast.tsx';
import { Sidebar } from './sidebar.tsx';

function readHash(): string {
	const raw = location.hash.replace(/^#/, '');
	if (!raw || raw === '/') return '/';
	return raw.startsWith('/') ? raw : `/${raw}`;
}

export function navigate(path: string): void {
	location.hash = path;
}

export function App() {
	const [db, setDb] = useState<BrowserQuestlogDb | null>(null);
	const [currentUrl, setCurrentUrl] = useState(readHash);
	const [loading, setLoading] = useState(false);
	const [revision, setRevision] = useState(0);
	const [sessionMode, setSessionMode] = useState<'blank' | 'seeded'>('seeded');
	const [sessionError, setSessionError] = useState<string | null>(null);

	const dbRef = useRef<BrowserQuestlogDb | null>(null);
	const { toasts, push: toast } = useToastState();

	useEffect(() => {
		const onHash = () => setCurrentUrl(readHash());
		window.addEventListener('hashchange', onHash);
		return () => window.removeEventListener('hashchange', onHash);
	}, []);

	const replaceDb = useCallback((next: BrowserQuestlogDb | null) => {
		if (dbRef.current) {
			dbRef.current.close();
		}
		dbRef.current = next;
		setDb(next);
	}, []);

	const resetSession = useCallback(
		async (mode: 'blank' | 'seeded') => {
			setLoading(true);
			setSessionError(null);
			try {
				const next = await createDemoSession(mode);
				replaceDb(next);
				setSessionMode(mode);
				setRevision(0);
			} catch (err) {
				setSessionError(err instanceof Error ? err.message : 'Failed to create session');
			} finally {
				setLoading(false);
			}
		},
		[replaceDb],
	);

	useEffect(() => {
		resetSession('seeded');
		return () => {
			if (dbRef.current) dbRef.current.close();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const mutate = useCallback(() => setRevision((r) => r + 1), []);

	function renderPage() {
		switch (currentUrl) {
			case '/intake':
				return <IntakePage />;
			case '/quests':
				return <QuestsPage />;
			case '/planning':
				return <PlanningPage />;
			case '/search':
				return <SearchPage />;
			default:
				return <DashboardPage />;
		}
	}

	return (
		<div class="demo-layout">
			<Sidebar
				currentUrl={currentUrl}
				onNavigate={navigate}
				onReset={resetSession}
				loading={loading}
				sessionMode={sessionMode}
			/>

			<main class="demo-main">
				{sessionError && (
					<div class="session-error-panel">
						<strong>Session Error</strong>
						<p>{sessionError}</p>
					</div>
				)}

				{db ? (
					<QuestlogContext.Provider value={{ db, revision, mutate, toast }}>
						{renderPage()}
					</QuestlogContext.Provider>
				) : (
					loading && <div class="loading-state">Starting session…</div>
				)}
			</main>

			<ToastStack toasts={toasts} />
		</div>
	);
}
