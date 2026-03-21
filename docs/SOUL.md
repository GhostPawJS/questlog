# Quest Soul And Integration

## Dedicated Quest Soul

Once Questlog is accepted as the canonical quest engine, the next layer should be
a focused quest-management soul with one domain only: quests.

That separation is not just architectural neatness. Delegation research keeps
showing the same pattern: [people often give up money to retain control](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2733142),
[trust is the strongest predictor of delegation willingness](https://delegability.github.io/about.html),
and [AI delegation can increase self-efficacy when it feels empowering rather than abdicated](https://dl.acm.org/doi/full/10.1145/3696423).
A dedicated quest soul makes that trust boundary legible.

### Soul Boundaries

- owns quest interpretation and tool use
- does not own persistence design
- does not compute availability logic itself
- does not reimplement recurrence, reward rules, or unlock rules in prompt text
- delegates zero quest work back to a generic warden

### Recommended Tool Surface

Target a small, explicit surface:

- `quest_capture_rumor`
- `quest_settle_rumor`
- `quest_create`
- `quest_plan`
- `quest_start`
- `quest_finish`
- `quest_abandon_with_followups`
- `quest_review_board`

If more tools are needed later, add them only when evidence shows a real reliability win.

### Soul Guidance

The soul prompt should emphasize:

- intake first, commitment second
- objective immutability after actual start
- follow-up spawning instead of rewriting history
- hard unlocks as true blockers
- scheduled work and due work as different truths
- rewards as descriptive attachments, not ceremony triggers

It should also stay sensitive to task type. Research suggests
[delegation willingness varies sharply by task category](https://link.springer.com/article/10.1007/s00146-026-02858-5),
so the soul should be naturally more assertive about routine digital work and
more deferential around ambiguous or high-stakes judgment.

## Ghostpaw Integration Plan

### Phase 1

Keep Questlog isolated and callable by tests and any future standalone adapter.
Do not partially mix it into the old quest toolchain.

### Phase 2

Build a dedicated quest tool adapter that maps each quest-soul tool directly
onto Questlog operations with minimal translation:

- tool parameters should mirror Questlog operations closely
- tool descriptions should encode the correct intent boundaries
- read tools should surface available, overdue, scheduled, deferred, and rumor-output views directly

Keeping the tool surface small matters too: Vercel's write-up on the
[tool-count cliff](https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools)
matches the practical lesson here. Fewer, clearer quest tools are easier to
select reliably than a wide surface of overlapping mutations.

### Phase 3

Remove quest responsibility from the overloaded warden surface:

- the coordinator delegates quest work to the dedicated quest soul
- persistence-heavy pack and memory work stays outside that soul
- quest delegations should carry concrete context, not vague free-form summaries

### Phase 4

Only after the dedicated soul proves reliable should any ecosystem-specific concepts be reintroduced:

- XP interpretation
- ceremony text
- autonomous embark behavior
- reward redemption effects

Those concerns should sit above the Questlog boundary, never inside it.

## Guardrails

### Automation Risk

The soul should acknowledge the
[automation paradox](https://en.wikipedia.org/wiki/Automation_paradox): the
more capable the automation becomes, the less practice the human gets, which can
make intervention harder when it finally matters. That concern is not academic;
studies report that tools like [GitHub Copilot can reduce security awareness by 12–20%](https://arxiv.org/pdf/2405.15349).
The answer is not to avoid automation, but to keep explanations, blocked states,
and handoff clarity good enough that people can re-enter the loop when they want.

### Drift Risk

Long-running agents also drift. Recent work documents
[progressive behavioral degradation over extended interactions](https://arxiv.org/html/2601.04170v1),
including a tendency to
["prematurely generate overly polished answers"](https://openreview.net/pdf/6aec466ee433ae854cb4c08747958b86d9741df5.pdf)
instead of absorbing feedback. That makes validation structure non-negotiable.

The soul layer should therefore prefer operating patterns informed by
[iterative self-verification](https://www.microsoft.com/en-us/research/publication/reveal-self-evolving-code-agents-via-reliable-self-verification/)
and [prospective reflection from historical error patterns](https://arxiv.org/pdf/2602.07187),
even when the underlying Questlog write surface itself remains simple.
