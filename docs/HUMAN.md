# Human Usage

This document is for people using Questlog directly in code.

It assumes a human developer or operator is working with the low-level public
API surface exposed at the package root through `read` and `write`.

If you are wiring Questlog into an agent or LLM harness, read `LLM.md` instead.
That document covers the soul, tools, and skills layers. This document is about
people using the underlying library directly.

## What This Surface Is For

Questlog is strongest when a human uses it as a progression model for work, not
as a flat task list.

A strong human operator usually has to manage several different kinds of truth
at once:

- incoming signals that may or may not matter
- active initiatives with multiple moving parts
- concrete executable commitments
- hard prerequisites
- recurring rhythms
- closure and earned outcomes

Questlog works best when each of those is modeled differently on purpose.

## The Human Modeling Rule

When using the direct API, keep these boundaries clean:

1. Put uncertainty in `rumors`.
2. Put multi-step arcs in `questlines`.
3. Put executable commitments in `quests`.
4. Put true gating logic in `unlocks`.
5. Put recurring rhythms in `repeatable_quests`.
6. Put cross-cutting classification in `tags`.
7. Put earned outcomes in `rewards`.

If those boundaries blur, the system becomes noisy and harder to trust.

## Which API Surface To Use

Human-facing direct usage usually looks like:

```ts
import { read, write } from '@ghostpaw/questlog';
```

This document uses those low-level domain calls directly:

- `write.captureRumor()`
- `write.settleRumor()`
- `write.createQuest()`
- `write.planQuestTime()`
- `write.addUnlock()`
- `read.listAvailableQuests()`
- `write.startQuest()`
- `write.finishQuest()`
- and the rest of the normal public API

That makes the examples useful for application code, scripts, backends, CLIs,
or custom interfaces where a human is still deciding what should happen.

## Example Portfolio

Assume one manager is responsible for four distinct streams:

- shipping a product launch
- renewing a vendor contract
- running a hiring loop
- maintaining a weekly executive update cadence

Each stream needs different treatment.

## The Human Operating Loop

The direct-code operating loop is simple:

1. Capture uncertainty.
2. Settle real work into the right structure.
3. Shape time and dependencies explicitly.
4. Execute from derived reads, not memory.
5. Keep recurring rhythms materialized into fresh concrete quests.
6. Close loops honestly.

## 1. Capture Incoming Work As Rumors

When signals arrive, do not force them into execution shape immediately.

Examples:

- "Legal says the vendor terms changed."
- "Marketing wants stronger launch confidence."
- "Candidate feedback is mixed."
- "Finance asked for a revised spend forecast."

Use:

```ts
write.captureRumor(db, {
  title: 'Legal says the vendor terms changed',
  details: 'Need to understand pricing delta and termination language.',
});
```

Other intake actions:

- `read.listRumors(db)` to review the open intake pool
- `read.getRumorDetail(db, rumorId)` to inspect one rumor plus any outputs it later produced
- `write.dismissRumor(db, rumorId, dismissedAt?)` when the signal should not become work
- `write.reopenRumor(db, rumorId, now?)` when a dismissed signal becomes relevant again

Human habit:

- capture quickly
- decide later
- never pollute the execution queue with unresolved uncertainty

## 2. Settle Real Work Into Questlines And Quests

Once a rumor becomes real, settle it into the right shape.

### Product Launch

If launch readiness clearly requires several concrete actions, create a
questline and its child quests together:

```ts
write.settleRumor(db, launchRumorId, {
  settledAt: now,
  questline: {
    title: 'Spring Launch',
    description: 'Shared context for the release campaign and readiness work.',
    dueAt: launchDate,
  },
  quests: [
    { title: 'Freeze release scope', objective: 'Lock the shipped surface.' },
    { title: 'Run staging rehearsal', objective: 'Verify launch path end to end.' },
    { title: 'Approve launch email', objective: 'Finalize outbound messaging.' },
  ],
});
```

### Vendor Renewal

```ts
write.settleRumor(db, vendorRumorId, {
  settledAt: now,
  questline: {
    title: 'Vendor Renewal',
    description: 'Commercial, legal, and approval work for renewal.',
  },
  quests: [
    { title: 'Collect redlines', objective: 'Obtain the latest legal markup.' },
    { title: 'Review pricing delta', objective: 'Compare current and proposed cost.' },
    { title: 'Obtain finance approval', objective: 'Secure approval for the renewal decision.' },
  ],
});
```

### Hiring Loop

```ts
write.settleRumor(db, hiringRumorId, {
  settledAt: now,
  questline: {
    title: 'Senior Designer Hiring',
    description: 'Structured loop from scorecard to offer.',
  },
  quests: [
    { title: 'Define scorecard', objective: 'Write evaluation criteria for interviewers.' },
    { title: 'Run panel debrief', objective: 'Synthesize interviewer signal.' },
    { title: 'Draft offer', objective: 'Prepare compensation and proposal details.' },
  ],
});
```

If the work is already clear and does not come from intake, create structure
directly:

- `write.createQuestline(db, input)`
- `write.createQuest(db, input)`

## 3. Shape Time Explicitly

Once concrete quests exist, add timing truth.

Use `write.planQuestTime(db, questId, input)` for:

- `notBeforeAt` when work should not become actionable yet
- `dueAt` when work has a real completion boundary
- `scheduledStartAt` and `scheduledEndAt` when there is a specific planned window

Example:

```ts
write.planQuestTime(db, questId, {
  dueAt: friday5pm,
  scheduledStartAt: thursday2pm,
  scheduledEndAt: thursday3pm,
});
```

Human habit:

- use `dueAt` for external commitments
- use `notBeforeAt` to protect attention from premature work
- use schedules sparingly for work that truly belongs on the calendar

## 4. Model Real Dependencies With Unlocks

If one quest must stay unavailable until another succeeds, use unlocks.

Example:

- "Obtain finance approval" should stay blocked until "Review pricing delta" is done

Use:

```ts
write.addUnlock(db, reviewPricingQuestId, financeApprovalQuestId, now);
```

Other dependency actions:

- `write.removeUnlock(db, fromQuestId, toQuestId, now?)`
- `write.replaceUnlocks(db, toQuestId, fromQuestIds, now?)`

Human habit:

- use unlocks only for true gating
- do not use them for soft preferred order
- let `read.listAvailableQuests()` and `read.listBlockedQuests()` surface the operational effect

## 5. Run Recurring Rhythms With Repeatables

Managers do not only manage projects. They also manage rhythm.

Good repeatable examples:

- weekly executive update
- weekly hiring review
- monthly vendor health check
- Friday launch readiness review

Create them once:

```ts
write.createRepeatableQuest(db, {
  title: 'Weekly executive update',
  objective: 'Prepare and send the weekly executive update.',
  rrule: 'FREQ=WEEKLY;BYDAY=FR',
  anchorAt: firstFridayAt9am,
  scheduledStartOffsetSeconds: 0,
  scheduledEndOffsetSeconds: 1800,
});
```

Then operate them in two steps:

```ts
read.listDueRepeatableQuestAnchors(db, now);
write.spawnDueRepeatableQuests(db, now);
```

Human habit:

- keep the template stable when the rhythm is stable
- update future behavior with `write.updateRepeatableQuest(db, repeatableQuestId, input)`
- stop new occurrences with `write.archiveRepeatableQuest(db, repeatableQuestId, archivedAt?)`

## 6. Tag For Cross-Cutting Views

Tags are useful when several streams need shared slicing.

Examples:

- `launch`
- `vendor`
- `finance`
- `hiring`
- `exec`
- `high-risk`

Useful calls:

- `write.tagQuest(db, questId, tagName, now?)`
- `write.untagQuest(db, questId, tagName, now?)`
- `write.replaceQuestTags(db, questId, tagNames, now?)`
- `write.replaceRepeatableQuestTags(db, repeatableQuestId, tagNames, now?)`

Human habit:

- tag for reporting and filtering
- do not use tags as pseudo-statuses

## 7. Execute From Reads, Not From Memory

A disciplined human operator should drive the day from derived views.

Core operational reads:

- `read.listAvailableQuests(db, filters?, now?)`
- `read.listBlockedQuests(db, filters?, now?)`
- `read.listDeferredQuests(db, filters?, now?)`
- `read.listInProgressQuests(db, filters?, now?)`
- `read.listDueSoonQuests(db, horizonMs, filters?, now?)`
- `read.listScheduledNow(db, filters?, now?)`
- `read.listMissedScheduledQuests(db, filters?, now?)`
- `read.listResolvedQuests(db, filters?, now?)`
- `read.getQuestDetail(db, questId, now?)`
- `read.listQuestlines(db, now?)`
- `read.getQuestlineDetail(db, questlineId, now?)`
- `read.searchQuestlog(db, query)`

Interpretation:

- available: push forward now
- blocked: unblock, escalate, or renegotiate
- deferred: intentionally ignore for now
- in progress: protect focus and finish
- due soon: prevent avoidable deadline risk
- scheduled now: follow planned execution windows
- missed scheduled: decide whether to reschedule, abandon, or re-scope
- resolved: review outcomes and close loops

## 8. Work A Quest Like Real Work

Once someone is actually doing the work:

```ts
write.startQuest(db, questId, startedAt);
write.logQuestEffort(db, questId, 1800, now);
```

If the objective is still mutable and the work has not really started yet:

```ts
write.reviseQuestObjective(db, questId, 'Updated concrete objective', now);
```

When the work resolves:

```ts
write.finishQuest(db, questId, 'Scope frozen and signed off.', resolvedAt);
```

If the work fails or should stop:

```ts
write.abandonQuest(db, questId, 'Renewal deferred to next quarter.', resolvedAt);
```

If abandoning the work should immediately create successor actions:

```ts
write.abandonQuestAndSpawnFollowups(db, questId, 'Current plan is no longer viable.', [
  { title: 'Find interim vendor option', objective: 'Identify short-term fallback.' },
  { title: 'Re-scope budget request', objective: 'Prepare revised budget path.' },
], resolvedAt);
```

Human habit:

- use `write.startQuest()` when execution truly begins, not when planning starts
- use `write.finishQuest()` for successful terminal truth
- use `write.abandonQuest()` when reality changed
- use follow-up spawning when failure naturally creates the next actions

## 9. Use Rewards For Earned Outcomes

Rewards are not the meaning of work. They are acknowledgements of outcomes.

Examples:

- `signed contract`
- `launch shipped`
- `budget approved`
- `offer accepted`

Useful calls:

- `write.addQuestReward(db, questId, input)`
- `write.updateQuestReward(db, rewardId, input)`
- `write.removeQuestReward(db, rewardId, now?)`
- `write.claimQuestReward(db, rewardId, claimedAt?)`
- `write.replaceRepeatableQuestRewards(db, repeatableQuestId, rewards, now?)`

Human habit:

- attach rewards when a quest should visibly yield something
- claim them when that outcome is actually realized
- remember that the yellow quest `?` remains only while an earned reward is still unclaimed

## 10. Example Weekly Flow

### Monday

Review intake:

- `read.listRumors(db)`

Settle the rumors that are now clearly real:

- launch concern -> launch questline plus concrete readiness quests
- vendor legal change -> renewal questline plus review and approval quests
- ambiguous hiring signal -> remain a rumor until more evidence exists

Then inspect:

- `read.listAvailableQuests(db, {}, now)`
- `read.listBlockedQuests(db, {}, now)`
- `read.listDueSoonQuests(db, threeDaysMs, {}, now)`

### Wednesday

Materialize recurring management rhythms:

- `read.listDueRepeatableQuestAnchors(db, now)`
- `write.spawnDueRepeatableQuests(db, now)`

Then work the spawned concrete quests like any other quest.

### Friday

Review the week:

- `read.listResolvedQuests(db, {}, now)`
- `read.listQuestlines(db, now)`
- `read.getQuestlineDetail(db, questlineId, now)`

Close loops:

- claim rewards that were actually earned
- archive finished arcs with `write.archiveQuestline(db, questlineId, archivedAt?)`
- dismiss intake that proved irrelevant

## What Good Human Usage Looks Like

Good usage:

- keep uncertainty as rumors until commitment is justified
- give major initiatives questlines
- give executable work quests
- use unlocks only for hard gates
- use repeatables for rhythm
- drive the day from derived reads

Bad usage:

- turning every vague signal into a quest immediately
- using questlines as status columns
- using tags as dependencies
- using unlocks for soft preference
- leaving recurring work as one immortal open quest

## The Core Principle

Questlog is not strongest when treated like a prettier task list.

It is strongest when used as a progression model:

- rumors absorb uncertainty
- questlines hold narrative context
- quests hold commitment and execution truth
- unlocks shape operational availability
- repeatables generate rhythm
- rewards and tags stay secondary

That is what lets a human operator manage several different domains at once
without losing the natural flow from signal to structure to action to closure.
