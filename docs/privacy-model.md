# Privacy Model

GATE V0.1 is local-first and stores data only in the browser extension's local storage.

## Stored Data

The extension stores:

- Category preferences.
- Hide unknown ads preference.
- Aggregate intercept stats.
- Recent intercept log entries.

Each log entry contains:

- `source`
- `input_type`
- `category`
- `gate_action`
- `reason`
- `timestamp`

## Local-Only Rules

- No backend.
- No cloud.
- No accounts.
- No external service calls.
- No AI service calls.
- No telemetry endpoint.
- No remote sync.

## Page Processing

The content script reads page DOM text only to detect ad-like elements and apply local keyword categories. Processing happens in the browser. GATE V0.1 does not transmit page content.

## User Control

The popup lets users change local preferences and clear local logs and stats.
