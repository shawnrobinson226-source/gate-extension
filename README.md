# GATE

GATE V0.1 is a local-first Manifest V3 Chrome/Edge extension for basic ad preference gating.

It lets a user allow or block these ad categories:

- gambling
- alcohol
- political
- adult
- finance
- retail
- travel
- technology
- education
- health

The extension also includes a local "hide unknown ads" preference for ad-like elements that cannot be categorized with the V0.1 keyword map.

## What V0.1 Does

- Detects ad-like elements with simple selectors and sponsored labels.
- Categorizes detected elements with local keyword maps.
- Hides locally blocked categories.
- Optionally hides unknown ad-like elements.
- Logs source, input type, category, gate action, reason, and timestamp.
- Stores preferences, stats, and recent log entries in `chrome.storage.local`.
- Shows category controls, stats, recent intercepts, and a clear-log action in the popup.

## What V0.1 Does Not Do

- No backend.
- No cloud sync.
- No accounts.
- No external services.
- No AI.
- No network calls.
- No AXIS, DES, or Sapphire behavior.

## Local Install

1. Open Chrome or Edge extension management.
2. Enable developer mode.
3. Choose "Load unpacked".
4. Select this project folder.

## Files

- `manifest.json`: MV3 extension declaration.
- `background.js`: storage defaults and intercept log handling.
- `content.js`: local ad detection, categorization, and hiding.
- `popup.html`: popup UI shell.
- `popup.js`: popup state loading and preference updates.
- `styles.css`: popup styles.
- `docs/`: product, scope, architecture, privacy, and boundary notes.
