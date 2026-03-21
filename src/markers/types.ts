export type MarkerId =
	| 'attention.available'
	| 'attention.available.repeatable'
	| 'attention.available.future'
	| 'progress.incomplete'
	| 'progress.complete';

export interface MarkerDefinition {
	id: MarkerId;
	family: 'attention' | 'progress';
	symbol: '!' | '?';
	wowColor: 'yellow' | 'blue' | 'gray';
	label: string;
	plainText: string;
	ttyText: string;
	htmlClass: string;
}
