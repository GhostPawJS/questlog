# Quest Faculty Tag Model

Tags are normalized, quest-scoped classification primitives.

## Scope

- concrete quests may carry tags
- repeatable quests may carry tag templates
- rumors and questlines do not carry tags

## Normalization

Tag identity is keyed by normalized name, while display casing is preserved from the canonical stored record.

This means:

- `"Work"` and `" work "` resolve to the same tag identity
- duplicate active links are avoided through normalization and replacement logic

## Template Copying

Repeatable quest tags are templates only.

Rules:

- spawned quests receive copies of the active template tags at materialization time
- later template edits affect future spawned quests only
- already spawned quest tags remain stable unless explicitly edited on the concrete quest itself
