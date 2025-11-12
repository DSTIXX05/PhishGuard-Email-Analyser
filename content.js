// content.js
// Runs in Gmail pages. Listen for messages from popup/background and return email data.
// Note: Gmail DOM can change — adjust selectors if necessary.

const SELECTORS = {
  subject: "h2.hP", // subject element in Gmail
  from: ".gD", // sender name element
  fromEmail: ".gD[email]", // not always present; fallback to data
  toList: ".g2 .gD", // recipients (in some views)
  date: "span.g3", // date element (may vary)
  body: ".a3s.aiL, .ii.gt", // message body container(s)
};

// Utility: extract first matching text content
function getText(selector, root = document) {
  const el = root.querySelector(selector);
  return el ? el.innerText.trim() : null;
}

// Utility: get HTML from selector
function getHTML(selector, root = document) {
  const el = root.querySelector(selector);
  return el ? el.innerHTML : null;
}

// Utility: find all links inside the email body
function extractLinksFromBody(bodyEl) {
  if (!bodyEl) return [];
  const anchors = Array.from(bodyEl.querySelectorAll("a[href]"));
  return anchors.map((a) => ({
    href: a.href,
    text: (a.innerText || a.getAttribute("aria-label") || "").trim(),
  }));
}

// Try common Gmail-specific places for fields (with fallbacks)
function extractEmailData() {
  // find a message container (Gmail loads multiple DOM patterns; try common ones)
  const subject = getText(SELECTORS.subject) || document.title || null;

  // From: Gmail often uses .gD for sender name and the email address in aria-label or email attribute.
  const fromEl = document.querySelector(".gD") || document.querySelector(".go");
  let from = null,
    fromAddress = null;
  if (fromEl) {
    from = fromEl.innerText?.trim() || null;
    // sometimes the email is stored in an attribute like 'email' or 'data-email'
    fromAddress =
      fromEl.getAttribute("email") || fromEl.getAttribute("data-email") || null;
    // attempt aria-label parsing if present (e.g., "Sender Name <sender@example.com>")
    const aria = fromEl.getAttribute("aria-label") || "";
    const m = aria.match(/<([^>]+)>/);
    if (!fromAddress && m) fromAddress = m[1];
  }

  // Date: Gmail uses several classes; try to find a timestamp in the header
  const date =
    getText(SELECTORS.date) ||
    (() => {
      const timeEl = document.querySelector("span.g3, span.hP"); // fallbacks
      return timeEl ? timeEl.innerText.trim() : null;
    })();

  // Body: try a3s.aiL first (most common). Some bodies are nested in .ii.gt
  const bodyEl = document.querySelector(SELECTORS.body);
  const bodyText = bodyEl
    ? bodyEl.innerText.trim()
    : (document.body.innerText || "").slice(0, 2000);
  const bodyHtml = bodyEl ? bodyEl.innerHTML : null;
  const links = bodyEl ? extractLinksFromBody(bodyEl) : [];

  // Recipients (to/cc) — best-effort: Gmail shows them in the header; collect visible ones
  const toEls = Array.from(document.querySelectorAll("div.hq .gD, .g2 .gD"));
  const recipients = toEls
    .map((el) => {
      const name = el.innerText?.trim();
      const email =
        el.getAttribute("email") ||
        el.getAttribute("data-email") ||
        (el.getAttribute("aria-label") || "").match(/<([^>]+)>/)?.[1] ||
        null;
      return { name, email };
    })
    .filter(Boolean);

  return {
    subject,
    from,
    fromAddress,
    recipients,
    date,
    bodyText,
    bodyHtml,
    links,
  };
}

// Gmail is dynamic — this helper waits briefly for the message to appear, using MutationObserver as fallback.
function waitForEmailThenExtract(timeout = 2500) {
  return new Promise((resolve) => {
    const data = extractEmailData();
    // If we have a decent body or subject, return immediately
    if ((data.bodyText && data.bodyText.length > 20) || data.subject) {
      resolve(data);
      return;
    }

    // Otherwise set up an observer for changes
    const observer = new MutationObserver((mutations, obs) => {
      const d = extractEmailData();
      if ((d.bodyText && d.bodyText.length > 20) || d.subject) {
        obs.disconnect();
        resolve(d);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      resolve(extractEmailData()); // best-effort
    }, timeout);
  });
}

// Listen for messages from popup/background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.action !== "extractEmail") return;
  waitForEmailThenExtract()
    .then((result) => {
      sendResponse({ success: true, email: result });
    })
    .catch((err) => {
      console.error("extractEmail error", err);
      sendResponse({ success: false, error: String(err) });
    });
  // Keep the message channel open for async response
  return true;
});
