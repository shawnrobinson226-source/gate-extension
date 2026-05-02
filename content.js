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

const KEYWORDS = {
  gambling: ["bet", "bets", "betting", "casino", "jackpot", "poker", "sportsbook", "wager"],
  alcohol: ["beer", "wine", "vodka", "whiskey", "bourbon", "tequila", "brewery", "cocktail"],
  political: ["campaign", "candidate", "congress", "election", "mayor", "senate", "vote", "voter"],
  adult: ["adult", "dating", "explicit", "hookup", "lingerie", "nsfw", "sexy"],
  finance: ["bank", "brokerage", "credit", "crypto", "insurance", "invest", "loan", "mortgage", "stock"],
  retail: ["buy", "cart", "coupon", "deal", "discount", "free shipping", "sale", "shop"],
  travel: ["airline", "cruise", "flight", "hotel", "luggage", "resort", "tour", "vacation"],
  technology: ["app", "cloud", "device", "gadget", "laptop", "phone", "software", "vpn"],
  education: ["bootcamp", "class", "course", "degree", "learn", "school", "training", "tutor"],
  health: ["clinic", "doctor", "fitness", "health", "medical", "pharmacy", "therapy", "wellness"]
};

const AD_SELECTORS = [
  "[id='ad' i]",
  "[id^='ad-' i]",
  "[id$='-ad' i]",
  "[id*='-ad-' i]",
  "[id='ads' i]",
  "[id^='ads-' i]",
  "[id$='-ads' i]",
  "[class~='ad' i]",
  "[class~='ads' i]",
  "[class~='advertisement' i]",
  "[class~='ad-container' i]",
  "[class~='ad-slot' i]",
  "[class~='ad-unit' i]",
  "[id*='sponsor' i]",
  "[class*='sponsor' i]",
  "[id*='promoted' i]",
  "[class*='promoted' i]",
  "[id*='promo' i]",
  "[class~='promo' i]",
  "[class~='promotion' i]",
  "[role='banner'][aria-label*='ad' i]",
  "[aria-label*='sponsor' i]",
  "[aria-label*='advertisement' i]",
  "iframe[src*='/ad' i]",
  "iframe[src*='ads.' i]",
  "iframe[src*='adserver' i]",
  "iframe[src*='doubleclick' i]",
  "iframe[src*='googlesyndication' i]"
];

const SPONSORED_TEXT = [
  "advertisement",
  "advertisements",
  "promoted",
  "sponsored",
  "sponsored content"
];

const HIDDEN_ATTRIBUTE = "data-gate-hidden";
const SCANNED_ATTRIBUTE = "data-gate-scanned";
const MAX_CANDIDATE_TEXT_LENGTH = 1200;
const MAX_CANDIDATE_AREA_RATIO = 0.35;
const NEARBY_TEXT_SELECTOR = "[aria-label], [title], span, small, strong, a, p";
let preferences = null;
let scanTimer = null;

function sendMessage(message) {
  try {
    chrome.runtime.sendMessage(message);
  } catch (_error) {
    // The page should keep working if the extension context reloads.
  }
}

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function textFromNode(node) {
  return normalize(node?.textContent || "");
}

function readSignalText(element) {
  const parts = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("alt"),
    element.id,
    element.className
  ];

  if (element instanceof HTMLIFrameElement) {
    parts.push(element.src);
  }

  return normalize(parts.filter(Boolean).join(" "));
}

function readCategoryText(element) {
  const nearbyText = Array.from(element.querySelectorAll(NEARBY_TEXT_SELECTOR))
    .slice(0, 12)
    .map((node) => [
      node.getAttribute("aria-label"),
      node.getAttribute("title"),
      node.textContent
    ].filter(Boolean).join(" "))
    .join(" ");

  const siblingText = [element.previousElementSibling, element.nextElementSibling]
    .filter(Boolean)
    .slice(0, 2)
    .map((node) => textFromNode(node).slice(0, 180))
    .join(" ");

  return normalize([
    readSignalText(element),
    textFromNode(element).slice(0, MAX_CANDIDATE_TEXT_LENGTH),
    nearbyText,
    siblingText
  ].filter(Boolean).join(" "));
}

function isSponsoredLabelText(text) {
  return text === "ad" ||
    text === "ads" ||
    SPONSORED_TEXT.some((label) => text === label || text.includes(label));
}

function hasSponsoredLabel(element) {
  const signalText = readSignalText(element);
  if (isSponsoredLabelText(signalText)) {
    return true;
  }

  return Array.from(element.querySelectorAll("span, small, a"))
    .slice(0, 8)
    .some((node) => isSponsoredLabelText(normalize(node.textContent)));
}

function isManageableCandidate(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element === document.body || element === document.documentElement) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const viewportArea = Math.max(window.innerWidth * window.innerHeight, 1);
  const candidateArea = Math.max(rect.width * rect.height, 0);

  if (candidateArea > viewportArea * MAX_CANDIDATE_AREA_RATIO) {
    return false;
  }

  return textFromNode(element).length <= MAX_CANDIDATE_TEXT_LENGTH;
}

function looksLikeAd(element) {
  const matchesSelector = AD_SELECTORS.some((selector) => {
    try {
      return element.matches(selector);
    } catch (_error) {
      return false;
    }
  });

  return isManageableCandidate(element) && (matchesSelector || hasSponsoredLabel(element));
}

function categorize(text) {
  for (const category of GATE_CATEGORIES) {
    if (KEYWORDS[category].some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "unknown";
}

function hideElement(element) {
  element.setAttribute(HIDDEN_ATTRIBUTE, "true");
  element.style.setProperty("display", "none", "important");
}

function gateElement(element) {
  if (!preferences || element.hasAttribute(SCANNED_ATTRIBUTE) || element.hasAttribute(HIDDEN_ATTRIBUTE)) {
    return;
  }

  if (!looksLikeAd(element)) {
    return;
  }

  element.setAttribute(SCANNED_ATTRIBUTE, "true");

  const text = readCategoryText(element);
  const category = categorize(text);
  const blockedByCategory = category !== "unknown" && preferences.categories[category] === "block";
  const blockedAsUnknown = category === "unknown" && preferences.hideUnknownAds;
  const shouldHide = blockedByCategory || blockedAsUnknown;
  const gateAction = shouldHide ? "blocked" : category === "unknown" ? "unknown" : "allowed";

  if (shouldHide) {
    hideElement(element);
  }

  sendMessage({
    type: "gate:recordIntercept",
    entry: {
      source: location.hostname || "page",
      input_type: hasSponsoredLabel(element) ? "sponsored_label" : "selector_match",
      category,
      gate_action: gateAction,
      reason: shouldHide
        ? category === "unknown"
          ? "Unknown ad hidden by preference."
          : `${category} category is blocked.`
        : category === "unknown"
          ? "Unknown ad detected but allowed by preference."
          : `${category} category is allowed.`,
      timestamp: new Date().toISOString()
    }
  });
}

function scan() {
  if (!preferences) {
    return;
  }

  const candidates = new Set();
  AD_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => candidates.add(element));
  });

  document.querySelectorAll("span, small, a").forEach((label) => {
    if (isSponsoredLabelText(normalize(label.textContent))) {
      const container = label.closest("iframe, [role='complementary'], aside, article, section, div, li");
      if (container) {
        candidates.add(container);
      }
    }
  });

  candidates.forEach((element) => gateElement(element));
}

function scheduleScan() {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(scan, 250);
}

async function loadPreferences() {
  const stored = await chrome.storage.local.get("preferences");
  preferences = stored.preferences || {
    hideUnknownAds: false,
    categories: Object.fromEntries(GATE_CATEGORIES.map((category) => [category, "allow"]))
  };
  scan();
}

sendMessage({ type: "gate:ensureDefaults" });
loadPreferences();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.preferences) {
    preferences = changes.preferences.newValue;
    document.querySelectorAll(`[${SCANNED_ATTRIBUTE}]`).forEach((element) => {
      element.removeAttribute(SCANNED_ATTRIBUTE);
    });
    scan();
  }
});

new MutationObserver(scheduleScan).observe(document.documentElement, {
  childList: true,
  subtree: true
});
