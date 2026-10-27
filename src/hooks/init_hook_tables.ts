import type { QuestlogDb } from '../database.ts';

export function initHookTables(db: QuestlogDb): void {
	db.exec(`
 CREATE TABLE IF NOT EXISTS hook_targets (
 id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, secret TEXT NOT NULL,
 tag TEXT, events TEXT NOT NULL, min_gap INTEGER NOT NULL, created_at INTEGER NOT NULL,
 last_wake INTEGER, lease_until INTEGER, claim TEXT);
 CREATE TABLE IF NOT EXISTS hook_events (
 id TEXT PRIMARY KEY, occurred_at INTEGER NOT NULL, event TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS hook_assignments (
 target_id INTEGER NOT NULL REFERENCES hook_targets(id) ON DELETE CASCADE,
 event_id TEXT NOT NULL REFERENCES hook_events(id), delivery_id TEXT,
 PRIMARY KEY(target_id, event_id));
 CREATE TABLE IF NOT EXISTS hook_deliveries (
 id TEXT PRIMARY KEY, target_id INTEGER NOT NULL REFERENCES hook_targets(id) ON DELETE CASCADE,
 events TEXT NOT NULL, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
 last_attempt_at INTEGER, http_status INTEGER, error_class TEXT,
 next_attempt_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_hook_deliveries_target ON hook_deliveries(target_id, status, next_attempt_at);
 CREATE TABLE IF NOT EXISTS hook_settings (id INTEGER PRIMARY KEY CHECK(id = 1), label TEXT NOT NULL);
 `);
}
