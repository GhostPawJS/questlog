const NAV_ITEMS = [
	{ href: '/', label: 'Dashboard', sub: 'Mission overview' },
	{ href: '/intake', label: 'Intake', sub: 'Rumors and triage' },
	{ href: '/quests', label: 'Quests', sub: 'Active operations' },
	{ href: '/planning', label: 'Planning', sub: 'Questlines and scheduling' },
	{ href: '/search', label: 'Search', sub: 'Full-text archives' },
] as const;

interface SidebarProps {
	currentUrl: string;
	onNavigate: (path: string) => void;
	onReset: (mode: 'blank' | 'seeded') => void;
	loading: boolean;
	sessionMode: string;
}

function isActive(href: string, currentUrl: string): boolean {
	if (href === '/') return currentUrl === '/';
	return currentUrl.startsWith(href);
}

export function Sidebar({ currentUrl, onNavigate, onReset, loading, sessionMode }: SidebarProps) {
	return (
		<aside class="demo-sidebar">
			<div class="sidebar-brand">
				<h1>Questlog</h1>
				<small>Interactive Demo</small>
			</div>

			<div class="sidebar-banner">
				This is a live demo running entirely in your browser against an in-memory database. Nothing
				is saved — refresh to reset.
			</div>

			<nav class="sidebar-nav">
				{NAV_ITEMS.map((item) => (
					<button
						type="button"
						key={item.href}
						class={`nav-item${isActive(item.href, currentUrl) ? ' active' : ''}`}
						onClick={() => onNavigate(item.href)}
					>
						<span class="nav-item-label">{item.label}</span>
						<span class="nav-item-sub">{item.sub}</span>
					</button>
				))}
			</nav>

			<div class="sidebar-footer">
				<div class="sidebar-status">
					<span class={`dot${loading ? ' loading' : ''}`} />
					{loading ? 'Loading…' : 'Ready'}
				</div>
				<div class="sidebar-status">Session: {sessionMode}</div>
				<div class="inline-actions">
					<button type="button" class="button secondary" onClick={() => onReset('blank')}>
						Blank
					</button>
					<button type="button" class="button primary" onClick={() => onReset('seeded')}>
						Seeded
					</button>
				</div>
			</div>
		</aside>
	);
}
