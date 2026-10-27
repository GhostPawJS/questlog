import { basename, extname } from 'node:path';
import type { QuestlogDb } from '../database.ts';

export function hookLabel(db: QuestlogDb, name?: string): string {
	if (name !== undefined) {
		if (!name.trim()) throw new Error('Expected a nonempty database label');
		db.prepare(
			'INSERT INTO hook_settings(id, label) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET label = excluded.label',
		).run(name);
	}
	const saved = db.prepare('SELECT label FROM hook_settings WHERE id = 1').get();
	if (saved) return String(saved.label);
	const path = String(
		db
			.prepare('PRAGMA database_list')
			.all()
			.find((row) => row.name === 'main')?.file ?? '',
	);
	return path ? basename(path, extname(path)) : 'questlog';
}
