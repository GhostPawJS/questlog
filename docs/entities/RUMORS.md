# `rumors`

## What It Is

`rumors` is the intake table.

A rumor is something that might matter, but is not yet a real commitment. It is
the right place for incoming ideas, requests, leads, obligations, or vague
signals that still need judgment.

## Why It Exists

Most systems force the operator to turn uncertainty into tasks too early.
Questlog does not.

That matters because [making a concrete plan reduces the cognitive pull of open
goals](https://users.wfu.edu/masicaej/MasicampoBaumeister2011JPSP.pdf), but
[cognitive offloading is only safe when the external system is trustworthy](https://www.nature.com/articles/s44159-025-00432-2).
`rumors` gives loose work a durable home before it deserves the weight of a
real commitment. It is also intentionally low-pressure: people report
[substantial anxiety around unprocessed inboxes](https://www.readless.app/blog/inbox-zero-statistics-2026),
so intake needs to feel like capture without premature obligation.

`rumors` exists so you can capture incoming work without pretending you already
know:

- whether it deserves action
- what the actual next steps are
- whether it should become one quest or many
- whether it belongs inside a broader questline

## How To Use It

Use a rumor when the operator wants to say:

- "remember this"
- "evaluate this later"
- "this might turn into work"
- "I need to think before committing"

Typical flow:

1. `captureRumor()` when something arrives.
2. Review it while it is still open.
3. `settleRumor()` when you know what real work it should create.
4. `dismissRumor()` when it is not worth acting on.
5. `reopenRumor()` if a dismissed item becomes relevant again.

## Good Uses

- a request from another person that still needs triage
- a project idea that is not ready for execution
- a bug report that may or may not be actionable
- a theme that might become a questline once clarified

## Do Not Use It For

- work someone can start right now
- scheduling committed work
- tracking execution progress
- representing a dependency

If it is actionable, it should become a quest. If it groups multiple quests, it
should usually also create a questline.

## Marker Notes

Rumor reads expose a computed `markerId` with intentionally narrow semantics:

- `attention.available`: the rumor is still open and waiting for triage
- `null`: the rumor was settled into downstream work or explicitly dismissed

This keeps intake visibility obvious without pretending rumors participate in
quest execution state.

## Related Tables

- `questlines`: a rumor can produce a questline
- `quests`: a rumor can produce one or more concrete quests

## Public APIs

### Writes

- `captureRumor(db, input)`: create a new intake item.
- `settleRumor(db, rumorId, input)`: resolve intake into nothing, quests, a questline, or both.
- `dismissRumor(db, rumorId, dismissedAt?)`: explicitly decline a rumor.
- `reopenRumor(db, rumorId, now?)`: return a dismissed rumor to the open pool.
- `softDeleteRumor(db, rumorId, now?)`: hide a rumor from normal active reads.

### Reads

- `getRumorDetail(db, rumorId)`: load one rumor with derived state and outputs.
- `getRumorOutputs(db, rumorId)`: list the quests and questlines produced from a rumor.
- `listRumors(db)`: list all active rumors.
