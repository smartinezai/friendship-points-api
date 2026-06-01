# API Reference

Base URL for local development:

```txt
http://localhost:3000
```

## Health

### `GET /health`

Returns:

```json
{
  "status": "ok"
}
```

---

## Friends

### `GET /friends`

Returns all non-deleted friends.

Soft-deleted friends are excluded.

### `GET /friends/:id`

Returns one non-deleted friend by ID.

Returns `404` if:

- the friend does not exist
- the friend has been soft-deleted

### `GET /friends/search?name=Cole`

Searches non-deleted friends by display name.

If `name` is missing:

```json
{
  "error": "Name query parameter is required."
}
```

### `POST /friends`

Creates a new friend.

```json
{
  "displayName": "Test Friend",
  "notes": "Created through API"
}
```

Validation:

- `displayName` must be at least 2 characters
- `notes` is optional
- `allowDuplicate` is optional and defaults to `false`

Duplicate behaviour:

If an active friend with the exact same `displayName` already exists, the API returns `409 Conflict`.

To intentionally create a duplicate:

```json
{
  "displayName": "Cole William Bailey",
  "notes": "Another person with the same name",
  "allowDuplicate": true
}
```

### `PATCH /friends/:id`

Updates a non-deleted friend's display name and/or replaces notes.

```json
{
  "displayName": "Cole Updated",
  "notes": "Replacement notes for Cole."
}
```

At least one field must be provided.

### `POST /friends/:id/notes/append`

Appends a new note to a non-deleted friend.

```json
{
  "note": "Cole also likes clear planning before calls."
}
```

### `DELETE /friends/:id`

Soft-deletes a friend.

Behaviour:

- sets `deletedAt`
- does not hard-delete the row
- keeps related rules, events, and assessments
- returns `404` if the friend does not exist
- returns `404` if the friend was already deleted

Verified behaviour:

```txt
DELETE active friend → 200
GET deleted friend → 404
DELETE already deleted friend → 404
```

---

## Rules

### `GET /friends/:friendId/rules`

Returns all rules for a non-deleted friend.

### `POST /friends/:friendId/rules`

Creates a rule for a non-deleted friend.

```json
{
  "title": "Unexpected calls are bad",
  "description": "Cole dislikes being called without prior warning.",
  "impactDirection": "negative",
  "weight": "high"
}
```

Validation:

- `title`: 2 to 100 characters
- `description`: 10 to 1000 characters
- `impactDirection`: `positive`, `negative`, `neutral`, or `mixed`
- `weight`: `minimal`, `low`, `medium`, `high`, `critical`, or `extreme`

### `PATCH /rules/:ruleId/weight`

Updates a rule's weight.

```json
{
  "weight": "critical"
}
```

---

## Events

### `GET /friends/:friendId/events`

Returns all events for a non-deleted friend.

### `POST /friends/:friendId/events`

Creates an event for a non-deleted friend.

```json
{
  "eventText": "I called Cole without prior warning.",
  "happenedAt": "2026-05-19T15:00:00.000Z"
}
```

Validation:

- `eventText`: 10 to 2000 characters
- `happenedAt`: optional ISO datetime string

### `GET /events/:eventId`

Returns one event by ID.

---

## Assessments

### `POST /events/:eventId/manual-assessment`

Creates a manual human-written assessment.

```json
{
  "scoreDelta": -3.5,
  "reason": "Testing decimal score."
}
```

Validation:

- `scoreDelta`: number between `-10` and `10`
- `reason`: optional

### `GET /friends/:friendId/balance`

Returns the friendship point balance by summing all assessment `scoreDelta` values for the friend's events.

```json
{
  "friendId": "friend-id",
  "balance": 9.5
}
```

### `POST /events/:eventId/mock-assessment`

Creates a mock LLM-style assessment without external API calls.

### `POST /events/:eventId/mistral-assessment`

Creates a real LLM assessment using Mistral via LangChain.

Stores:

```txt
scoreDelta
reasoningSummary
impactDirection
confidence
matchedRuleIds
biasNotes
source
modelName
promptVersion
```

### `POST /events/:eventId/openai-assessment`

Creates a real LLM assessment using the OpenAI/LangChain service.

Status:

```txt
Route exists, but OpenAI API calls are currently blocked by quota.
```

---

## Predictions

### `POST /friends/:friendId/predict`

Creates a mock prediction for a hypothetical action.

Does not save an `Event` or `Assessment`.

```json
{
  "hypotheticalAction": "I call Cole without warning tomorrow."
}
```

### `POST /friends/:friendId/predict/mistral`

Creates a real Mistral prediction for a hypothetical action.

Does not save an `Event` or `Assessment`.

```json
{
  "hypotheticalAction": "I call Cole without warning tomorrow."
}
```

---

## Error helpers

The API uses shared HTTP error helpers:

```txt
sendValidationError      → 400 invalid request body
sendBadRequestError      → 400 general bad request
sendNotFoundError        → 404 missing resource
sendInternalServerError  → 500 unexpected server/provider failure
```
