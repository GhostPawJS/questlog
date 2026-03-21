---
name: tag-and-filter-portfolios
description: Classify and slice work cleanly without inventing fake statuses. Use when reviewing one stream, function, risk class, or reporting slice across a larger portfolio.
---

# Tag And Filter Portfolios

## Instructions

1. Use tags for cross-cutting classification, not for lifecycle state.
2. Apply tags with:
   - `tagQuest(...)`
   - `untagQuest(...)`
   - `replaceQuestTags(...)`
   - `replaceRepeatableQuestTags(...)`
3. Review slices with quest list filters such as `tagNames` or `questlineId`.
4. Normalize tag vocabulary early. Reuse one stable term for each theme or stream.
5. Use tags to compare portfolios, not to replace due dates, dependencies, or ownership.

## Failure Paths

- If a tag starts acting like a status, stop and move that meaning into the correct field or read view.
- If one stream is still noisy, use a questline filter or better quest framing instead of inventing more tags.
- If the same meaning appears in multiple spellings, clean it up before reporting from it.

## Do Not

- use tags as dependency logic
- use tags as a substitute for prioritization
- let tag vocabulary drift by accident
