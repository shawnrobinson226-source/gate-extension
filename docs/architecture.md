# Architecture

GATE V0.1 is a local Manifest V3 extension with three runtime surfaces.

## Manifest

`manifest.json` declares:

- Manifest V3.
- `storage` permission.
- `<all_urls>` host permission for content script matching.
- Background service worker.
- Content script.
- Popup.

## Background Service Worker

`background.js` owns local defaults and log writes.

Responsibilities:

- Ensure default preferences, stats, and log keys exist.
- Receive intercept messages from `content.js`.
- Increment local stats.
- Store recent log entries in `chrome.storage.local`.

## Content Script

`content.js` runs locally on pages.

Responsibilities:

- Read preferences from `chrome.storage.local`.
- Detect ad-like DOM elements using basic selectors and sponsored labels.
- Categorize candidates using local keyword maps.
- Hide blocked category elements.
- Hide unknown elements only when the user enables that preference.
- Send local intercept events to the background worker.
- Re-scan when page content changes.

## Popup

`popup.html`, `popup.js`, and `styles.css` provide the extension UI.

Responsibilities:

- Show blocked, allowed, and unknown stats.
- Show category allow/block controls.
- Show hide unknown ads toggle.
- Show recent intercept log.
- Clear local log and stats.

## Data Storage

All state is stored in `chrome.storage.local`:

- `preferences`
- `stats`
- `log`

No external persistence exists in V0.1.
