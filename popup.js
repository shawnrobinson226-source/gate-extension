const CATEGORIES = [
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
  categories: Object.fromEntries(CATEGORIES.map((category) => [category, "allow"]))
};

const DEFAULT_STATS = {
  blocked: 0,
  allowed: 0,
  unknown: 0
};

const categoryControls = document.querySelector("#category-controls");
const hideUnknown = document.querySelector("#hide-unknown");
const recentLog = document.querySelector("#recent-log");
const clearLog = document.querySelector("#clear-log");
const blockedCount = document.querySelector("#blocked-count");
const allowedCount = document.querySelector("#allowed-count");
const unknownCount = document.querySelector("#unknown-count");

let preferences = DEFAULT_PREFERENCES;

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

async function loadState() {
  await chrome.runtime.sendMessage({ type: "gate:ensureDefaults" });
  const stored = await chrome.storage.local.get(["preferences", "stats", "log"]);
  preferences = {
    hideUnknownAds: Boolean(stored.preferences?.hideUnknownAds),
    categories: {
      ...DEFAULT_PREFERENCES.categories,
      ...(stored.preferences?.categories || {})
    }
  };

  renderPreferences();
  renderStats(stored.stats || DEFAULT_STATS);
  renderLog(Array.isArray(stored.log) ? stored.log : []);
}

function renderPreferences() {
  hideUnknown.checked = preferences.hideUnknownAds;
  categoryControls.innerHTML = "";

  CATEGORIES.forEach((category) => {
    const row = document.createElement("div");
    row.className = "category-row";

    const label = document.createElement("span");
    label.textContent = titleCase(category);

    const select = document.createElement("select");
    select.setAttribute("aria-label", `${category} action`);
    select.dataset.category = category;

    ["allow", "block"].forEach((action) => {
      const option = document.createElement("option");
      option.value = action;
      option.textContent = titleCase(action);
      select.append(option);
    });

    select.value = preferences.categories[category] || "allow";
    row.append(label, select);
    categoryControls.append(row);
  });
}

function renderStats(stats) {
  blockedCount.textContent = String(stats.blocked || 0);
  allowedCount.textContent = String(stats.allowed || 0);
  unknownCount.textContent = String(stats.unknown || 0);
}

function renderLog(log) {
  recentLog.innerHTML = "";

  if (log.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-log";
    empty.textContent = "No intercepts logged yet.";
    recentLog.append(empty);
    return;
  }

  log.slice(0, 12).forEach((entry) => {
    const item = document.createElement("li");
    const main = document.createElement("strong");
    const detail = document.createElement("span");
    const time = document.createElement("small");

    main.textContent = `${entry.gate_action || "unknown"} / ${entry.category || "unknown"}`;
    detail.textContent = `${entry.source || "page"} - ${entry.reason || "No reason recorded."}`;
    time.textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "";

    item.append(main, detail, time);
    recentLog.append(item);
  });
}

async function savePreferences() {
  await chrome.storage.local.set({ preferences });
}

categoryControls.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement) || !target.dataset.category) {
    return;
  }

  preferences = {
    ...preferences,
    categories: {
      ...preferences.categories,
      [target.dataset.category]: target.value
    }
  };
  savePreferences();
});

hideUnknown.addEventListener("change", () => {
  preferences = {
    ...preferences,
    hideUnknownAds: hideUnknown.checked
  };
  savePreferences();
});

clearLog.addEventListener("click", async () => {
  await chrome.storage.local.set({ log: [], stats: DEFAULT_STATS });
  renderStats(DEFAULT_STATS);
  renderLog([]);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") {
    return;
  }

  if (changes.stats) {
    renderStats(changes.stats.newValue || DEFAULT_STATS);
  }

  if (changes.log) {
    renderLog(Array.isArray(changes.log.newValue) ? changes.log.newValue : []);
  }
});

loadState();
