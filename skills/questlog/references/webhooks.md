# Webhooks

Use `questlog` to configure opt-in outbound automation. No server or scheduler is added.
No targets means no network calls. `manage_hooks` supports list, remove, tick with
`dry_run`, and deliveries; add/test are CLI-only. `review_questlog` view `deliveries`
and `questlog show <id>` expose pending/failed deliveries.

```sh
questlog hook add https://example.org/wake --min-gap 60
questlog hook add https://example.org/team --tag work --events quest.due,quest.overdue --secret-stdin
questlog hook label work
questlog hook list
questlog tick --dry-run
questlog tick
questlog watch --interval 60
questlog hook test 1
questlog review deliveries
questlog show 12
questlog hook remove 1
```

`hook add` prints its random 32-byte signing secret once, also as `secret` in `--json`.
Save it securely. `--secret-stdin` supplies one via stdin; there is no secret flag.
Secrets and custom header values are stored in the DB. New POSIX DB/WAL/SHM files use 0600 and created directories use 0700; existing DB modes are preserved. Windows uses existing access controls.
Use repeatable `--header "Name: value"` or `--header-stdin` (one line per header, avoiding shell history). Headers are sent on every delivery and test; output shows names with `***` values. HTTP token names are required; host, content-length, content-type, and x-questlog-* are reserved. Change headers by removing and adding the hook again. Use --header-stdin and --secret-stdin separately. URL userinfo is rejected; use a custom header or query key.
`questlog show d_…` displays delivery status, attempts, HTTP status, next attempt, redacted target URL and event ids. Text is the default; --json prints JSON. Missing hook remove/test targets exit 3; missing quests/deliveries exit 1. hook label names the database.
List output redacts userinfo/query strings. Removal deletes the target and deliveries.
Default scope is the database; `--tag` matches quest tags, never rumors.
`--events` defaults to all types. The DB label defaults to the filename without its
path/extension (`questlog` in memory); set it to a name suitable for disclosure.

```cron
* * * * * questlog tick
```

Cron's PATH may need `$HOME/.local/bin/questlog tick --db /path/to/quests.db`.
Watch defaults to 60 seconds (minimum 5); SIGINT/SIGTERM finishes the current tick.
Tick exits 0 even when deliveries need retries. Dry-run records nothing and sends nothing.

Events are detected from the model at tick time:

- `quest.due`: an unresolved, undeleted quest reaches its effective due time (own `due_at`, otherwise its undeleted questline's due time).
- `quest.overdue`: that effective deadline is strictly earlier than now and the quest remains unresolved.
- `quest.unblocked`: an unresolved quest is available, all active prerequisites have succeeded or been deleted, and at least one prerequisite succeeded after its unlock was installed. Occurrence time is the latest active prerequisite success or not-before time, whichever is later.
- `repeatable.spawned`: a concrete repeatable instance was created; occurrence time is its creation time. Tick first materializes due anchors through the existing spawn operation.
- `rumor.captured`: an undeleted rumor was created; occurrence time is its creation time, even if subsequently settled or dismissed.

Persistent event keys contain type, entity ids, and occurrence time. Restarts and repeated
ticks do not repeat occurrences. Removed transitions between ticks cannot be reconstructed.
Only occurrences at/after target creation are assigned; tags are evaluated at assignment.
Tick materializes due repeatables using the existing spawn path, including during preview
with rollback. Batches contain only ids, event types, timestamps, and the DB label:

```json
{"type":"questlog.events","db":"work","deliveryId":"d_…","sentAt":"2026-10-28T10:00:00.000Z","events":[{"id":"e_…","type":"quest.due","questId":12,"occurredAt":"2026-10-28T09:59:00.000Z"}]}
```

Headers are `content-type: application/json`, `user-agent: questlog/<version>`,
`x-questlog-delivery: <deliveryId>`, `x-questlog-timestamp: <unix seconds>`, and
`x-questlog-signature: sha256=<hex HMAC-SHA256(secret, timestamp + "." + rawBody)>`.
No titles, objectives, details, or tag text are sent. `hook test` sends a logged `hook.test`
event immediately, ignoring the min gap. Add and test are CLI-only in the tool facade;
`manage_hooks` supports list, remove, tick (with `dry_run`), and deliveries.

2xx delivers. Timeout is 5 seconds. Failures retry after 30 s, 1 m, 2 m, 4 m, doubling
to 1 h plus <1 s jitter, subject to the target's min gap. Eight failures mark failed.
Retries keep the delivery id/events; new events queue behind them. Keep the last 500
delivered log entries per target and all pending/failed entries. Transactional claims
lease work for two minutes. A crash after receipt may retry: dedupe at the receiver.

### Verifying a delivery

Compute HMAC-SHA256 over `timestamp + "." + rawBody` with the secret and compare in constant
time. Reject timestamps older than 5 minutes (and timestamps too far in the future), then
dedupe on `x-questlog-delivery`. Use durable deduplication storage in a production receiver.
This 15-line Node example uses an in-memory set:

```js
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
const secret = process.env.WEBHOOK_SECRET, seen = new Set();
createServer(async (req, res) => {
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks), h = req.headers;
  const timestamp = h['x-questlog-timestamp'], id = h['x-questlog-delivery'];
  const age = Date.now() / 1000 - Number(timestamp);
  const expected = createHmac('sha256', secret).update(timestamp + '.').update(rawBody).digest();
  const signature = String(h['x-questlog-signature'] || '');
  const actual = Buffer.from(signature.slice(7), 'hex');
  if (!id || !/^\d+$/.test(timestamp) || age > 300 || age < -300 || !/^sha256=[a-f0-9]{64}$/.test(signature) || actual.length !== expected.length || !timingSafeEqual(actual, expected)) { res.writeHead(401).end(); return; }
  if (!seen.has(id)) { seen.add(id); console.log(JSON.parse(rawBody)); }
  res.writeHead(204).end();
}).listen(8080, '127.0.0.1');
```
