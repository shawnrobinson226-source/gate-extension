const GATE_CATEGORIES = [
  "gambling",
  "alcohol",
  "political",
  "adult",
  "finance",
  "retail",
  "travel",
  "technology",
  "education",
  "health"
];

const DEFAULT_PREFERENCES = {
  hideUnknownAds: false,
  categories: Object.fromEntries(GATE_CATEGORIES.map((category) => [category, "allow"]))
};

const DEFAULT_STATS = {
  blocked: 0,
  allowed: 0,
  unknown: 0
};

async function getLocal(keys) {
  return chrome.storage.local.get(keys);
}

async function setLocal(values) {
  return chrome.storage.local.set(values);
}

async function ensureDefaults() {
  const stored = await getLocal(["preferences", "stats", "log"]);
  const preferences = stored.preferences || DEFAULT_PREFERENCES;
  const stats = stored.stats || DEFAULT_STATS;
  const log = Array.isArray(stored.log) ? stored.log : [];

  await setLocal({
    preferences: {
      hideUnknownAds: Boolean(preferences.hideUnknownAds),
      categories: {
        ...DEFAULT_PREFERENCES.categories,
        ...(preferences.categories || {})
      }
    },
    stats: {
      ...DEFAULT_STATS,
      ...stats
    },
    log
  });
}

async function recordIntercept(entry) {
  const stored = await getLocal(["stats", "log"]);
  const stats = {
    ...DEFAULT_STATS,
    ...(stored.stats || {})
  };
  const gateAction = entry.gate_action;

  if (gateAction === "blocked") {
    stats.blocked += 1;
  } else if (gateAction === "allowed") {
    stats.allowed += 1;
  } else if (gateAction === "unknown") {
    stats.unknown += 1;
  }

  const log = Array.isArray(stored.log) ? stored.log : [];
  const nextLog = [
    {
      source: entry.source || "page",
      input_type: entry.input_type || "ad_element",
      category: entry.category || "unknown",
      gate_action: gateAction || "unknown",
      reason: entry.reason || "No reason provided.",
      timestamp: entry.timestamp || new Date().toISOString()
    },
    ...log
  ].slice(0, 100);

  await setLocal({ stats, log: nextLog });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureDefaults();
});

chrome.runtime.onStartup.addListener(() => {
  ensureDefaults();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === "gate:ensureDefaults") {
    ensureDefaults().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "gate:recordIntercept") {
    recordIntercept(message.entry || {}).then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});
