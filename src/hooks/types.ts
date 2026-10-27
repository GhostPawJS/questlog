export const hookEventTypes = [
	'quest.due',
	'quest.overdue',
	'quest.unblocked',
	'repeatable.spawned',
	'rumor.captured',
] as const;
export type HookEventType = (typeof hookEventTypes)[number];
export interface HookEvent {
	id: string;
	type: HookEventType | 'hook.test';
	questId?: number;
	rumorId?: number;
	repeatableId?: number;
	occurredAt: string;
}
export interface HookTarget {
	id: number;
	url: string;
	tag: string | null;
	scope: 'database' | 'tag';
	events: HookEventType[];
	minGap: number;
	createdAt: number;
	lastWake: number | null;
	pending: number;
	failed: number;
}
export interface HookDelivery {
	id: string;
	targetId: number;
	events: HookEvent[];
	status: 'pending' | 'delivered' | 'failed';
	attempts: number;
	lastAttemptAt: number | null;
	httpStatus: number | null;
	errorClass: string | null;
	nextAttemptAt: number;
}
export interface TickOptions {
	now?: number;
	clock?: () => number;
	fetch?: typeof globalThis.fetch;
	dryRun?: boolean;
	timeoutMs?: number;
}
export interface TickResult {
	events: HookEvent[];
	batches: { targetId: number; events: HookEvent[] }[];
	sent: number;
	queued: number;
	retrying: number;
	failed: number;
}
