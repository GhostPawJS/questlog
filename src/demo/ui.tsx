import type { ComponentChildren } from 'preact';

export function Panel({
	title,
	subtitle,
	actions,
	children,
}: {
	title: string;
	subtitle?: string;
	actions?: ComponentChildren;
	children: ComponentChildren;
}) {
	return (
		<section class="panel">
			<div class="panel-header">
				<h2>{title}</h2>
				{actions}
			</div>
			{subtitle && <p class="panel-subtitle">{subtitle}</p>}
			{children}
		</section>
	);
}

export function Badge({
	label,
	variant,
	title,
}: {
	label: string;
	variant?: 'state' | 'tag' | 'entity' | 'success' | 'danger' | 'warning' | 'info';
	title?: string;
}) {
	return (
		<span class={`badge ${variant ?? ''}`} title={title}>
			{label}
		</span>
	);
}

export function SummaryCard({
	label,
	value,
	sublabel,
}: {
	label: string;
	value: string | number;
	sublabel?: string;
}) {
	return (
		<div class="summary-card">
			<span class="summary-label">{label}</span>
			<span class="summary-value">{value}</span>
			{sublabel && <span class="summary-sublabel">{sublabel}</span>}
		</div>
	);
}

export function EmptyState({
	message,
	actionLabel,
	onAction,
}: {
	message: string;
	actionLabel?: string;
	onAction?: () => void;
}) {
	return (
		<div class="empty-state">
			<p>{message}</p>
			{actionLabel && onAction && (
				<button type="button" class="button secondary" onClick={onAction}>
					{actionLabel}
				</button>
			)}
		</div>
	);
}

export function FormField({
	label,
	htmlFor,
	hint,
	required,
	error,
	children,
}: {
	label: string;
	htmlFor?: string;
	hint?: string;
	required?: boolean;
	error?: string;
	children: ComponentChildren;
}) {
	return (
		<div class="field">
			<label for={htmlFor}>
				{label}
				{required && <span class="required">*</span>}
			</label>
			{children}
			{error && <small class="field-error">{error}</small>}
			{hint && !error && <small class="field-hint">{hint}</small>}
		</div>
	);
}

export function DataRow({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: string;
	children: ComponentChildren;
}) {
	return (
		<div class="data-row">
			<div class="data-row-label">
				{label}
				{hint && <small>{hint}</small>}
			</div>
			<div class="data-row-value">{children}</div>
		</div>
	);
}

export function Explainer({ title, children }: { title: string; children: ComponentChildren }) {
	return (
		<details class="explainer">
			<summary>{title}</summary>
			<div class="explainer-body">{children}</div>
		</details>
	);
}

export function TabBar({
	tabs,
	active,
	onChange,
}: {
	tabs: Array<{ id: string; label: string }>;
	active: string;
	onChange: (id: string) => void;
}) {
	return (
		<div class="tab-bar">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					type="button"
					class={`tab-btn ${tab.id === active ? 'active' : ''}`}
					onClick={() => onChange(tab.id)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}

export function formatTime(ts: number | null | undefined): string {
	if (ts == null) return '—';
	return new Date(ts).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function formatDuration(seconds: number | null | undefined): string {
	if (seconds == null) return '—';
	const abs = Math.abs(seconds);
	const h = Math.floor(abs / 3600);
	const m = Math.floor((abs % 3600) / 60);
	if (h > 0 && m > 0) return `${h}h ${m}m`;
	if (h > 0) return `${h}h`;
	if (m > 0) return `${m}m`;
	return '<1m';
}

export function relativeTime(ts: number | null | undefined): string {
	if (ts == null) return '—';
	const now = Date.now();
	const diffMs = ts - now;
	const absDiffMs = Math.abs(diffMs);

	if (absDiffMs < 60_000) return 'just now';

	const minutes = Math.floor(absDiffMs / 60_000);
	const hours = Math.floor(absDiffMs / 3_600_000);
	const days = Math.floor(absDiffMs / 86_400_000);

	if (days > 0) {
		const label = days === 1 ? '1 day' : `${days} days`;
		return diffMs < 0 ? `${label} ago` : `in ${label}`;
	}
	if (hours > 0) {
		const label = hours === 1 ? '1 hour' : `${hours} hours`;
		return diffMs < 0 ? `${label} ago` : `in ${label}`;
	}
	const label = minutes === 1 ? '1 minute' : `${minutes} minutes`;
	return diffMs < 0 ? `${label} ago` : `in ${label}`;
}
