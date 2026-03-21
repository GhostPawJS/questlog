---
name: handle-exceptions-and-weird-cases
description: Handle one-off cases without breaking model truth or pretending the happy path still applies. Use when policy, process, or work shape exceptions appear and a normal workflow no longer fits safely.
---

# Handle Exceptions And Weird Cases

## Instructions

1. First identify what is exceptional: policy, timing, approval path, dependency, ownership, or bad work shape.
2. Inspect the exact record before improvising:
   - `getQuestDetail(...)`
   - `getQuestlineDetail(...)`
   - `getRumorDetail(...)`
3. Preserve truth first. Prefer honest state changes over clever hacks.
4. Choose the closest real move:
   - clarify the request
   - keep it in intake
   - reshape the commitment
   - create successor work
   - escalate the exception
   - recover from a modeling mistake
5. If the exception is likely to recur, note that it should become a future skill improvement rather than another improvised workaround.

## Failure Paths

- If no existing workflow fits, do not fake a normal state just to keep the board tidy.
- If the exception is really a hidden dependency or approval problem, hand off instead of masking it.
- If the edge case would corrupt historical truth, stop and preserve the record before changing anything.

## Do Not

- bend the model until it lies
- encode a one-off exception as a new default pattern
- confuse “rare” with “safe to ignore”
