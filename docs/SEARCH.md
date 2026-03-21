# Quest Faculty Search And Indexing

The faculty ships with full-text search as foundational infrastructure, not as an optional add-on.

## Indexed Entities

- `rumors`
- `quests`

Questlines, repeatable definitions, rewards, and tags remain relational reads today and are not part of the FTS corpus.

## Implementation Shape

- `rumors_fts` is an FTS5 virtual table backed by `rumors`
- `quests_fts` is an FTS5 virtual table backed by `quests`
- insert, update, and delete triggers keep each index synchronized with the source table
- soft-deleted rows are removed from the active FTS surface by trigger-maintained deletes

## Query Surface

- `searchQuestFaculty(db, query)`

The result surface is intentionally narrow:

- `entityKind`
- `entityId`
- `title`
- `snippet`

This keeps search cheap, stable, and easy to compose with follow-up detail reads.
