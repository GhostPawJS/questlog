import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { QuestlogDb } from '../database.ts';

export interface QuestlogContextValue {
	db: QuestlogDb;
	revision: number;
	mutate: () => void;
	toast: (msg: { ok: boolean; title: string; body?: string }) => void;
}

export const QuestlogContext = createContext<QuestlogContextValue | null>(null);

export function useQuestlog(): QuestlogContextValue {
	const ctx = useContext(QuestlogContext);
	if (ctx === null) throw new Error('useQuestlog called outside provider');
	return ctx;
}
