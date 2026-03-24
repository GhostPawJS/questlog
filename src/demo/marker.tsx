import type { MarkerId } from '../markers/index.ts';
import { markerLookup } from '../markers/index.ts';

interface QuestMarkerProps {
	markerId: MarkerId | null;
	size?: 'sm' | 'md' | 'lg';
}

export function QuestMarker({ markerId, size = 'md' }: QuestMarkerProps) {
	if (markerId === null) return null;

	const def = markerLookup[markerId];
	const familyClass = def.family === 'attention' ? 'attention' : '';

	return (
		<span
			role="img"
			class={`marker ${size} ${def.wowColor} ${familyClass} ${def.htmlClass}`}
			title={def.label}
			aria-label={def.plainText}
		>
			{def.symbol}
		</span>
	);
}
