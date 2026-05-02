# GATE V0.1 Product Brief

GATE is a local-first browser extension that gives users a simple preference gate for ad categories.

## Goal

Build a minimal Local Ad Preference Gate for Chrome and Edge using Manifest V3.

## User Value

Users can express which ad categories they want blocked or allowed without creating an account, sending data to a server, or relying on remote classification.

## V0.1 Categories

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

## Core Behavior

- Detect ad-like elements with basic DOM selectors and sponsored text labels.
- Categorize detected elements with local keyword maps.
- Hide blocked categories.
- Optionally hide unknown ad-like elements.
- Record local stats and a recent intercept log.
- Let the user update preferences in the popup.

## Product Boundaries

V0.1 is not a comprehensive ad blocker, identity system, cloud service, or AI classifier. It is a local preference layer with simple detection and simple category controls.
