# AXIS Boundary

GATE V0.1 has no AXIS behavior.

## Explicit Boundary

This extension does not include:

- AXIS.
- DES.
- Sapphire.
- Backend systems.
- Accounts.
- Cloud services.
- AI models or AI service calls.
- Remote policy engines.
- Remote classification systems.

## V0.1 Responsibility

GATE V0.1 is only a local ad preference gate:

- It detects ad-like page elements with basic local rules.
- It categorizes them with a local keyword map.
- It hides blocked or unknown elements according to local user preferences.
- It stores preferences, stats, and logs in `chrome.storage.local`.

Any future concept that requires remote services, identity, AI classification, or non-local policy execution is outside this V0.1 boundary.
