---
name: search-and-retrieve-context
description: Retrieve prior work and intake accurately without confusing full-text search with relational reads. Use when looking up existing rumors or quests quickly before creating new work or making a decision.
---

# Search And Retrieve Context

## Instructions

1. Use `searchQuestlog(db, query)` for fast text lookup across rumors and quests.
2. Use targeted reads for relational context:
   - `getQuestDetail(...)`
   - `getQuestlineDetail(...)`
   - `getRumorDetail(...)`
   - list reads with filters
3. Search before creating duplicate intake or duplicate quests.
4. When a search hit matters operationally, open the exact record detail before acting.
5. Remember what search does not cover: questlines, repeatable definitions, rewards, and tags are not in the FTS corpus.

## Failure Paths

- If search returns nothing, do not assume the system is empty; check whether you are looking for a non-FTS entity.
- If several similar results appear, choose the record with the right state, timing, and marker before editing or settling.
- If you need one portfolio slice, prefer filtered reads over broad keyword search.

## Do Not

- use search as a replacement for structured review
- assume FTS is global across every entity
- create a new rumor or quest before checking for obvious duplicates
