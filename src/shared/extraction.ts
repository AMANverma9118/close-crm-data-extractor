import { ensureId, normalizeText, toDateString } from "./utils";
import type {
  CloseView,
  Contact,
  ExtractionSnapshot,
  Opportunity,
  Task,
} from "./types";


export function detectView(): CloseView {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("opportunit")) return "opportunities";
  if (path.includes("task")) return "tasks";
  if (path.includes("contact") || path.includes("lead")) return "contacts";

  if (
    document.querySelector(
      '[data-testid*="opportunity"], [data-test*="opportunity"]'
    )
  ) {
    return "opportunities";
  }
  if (document.querySelector('[data-testid*="task"], [data-test*="task"]')) {
    return "tasks";
  }
  if (document.querySelector('[data-testid*="contact"], [data-test*="lead"]')) {
    return "contacts";
  }
  return "unknown";
}

export function extractContacts(): Contact[] {
  const rows = Array.from(
    document.querySelectorAll<HTMLTableRowElement>(
      'tbody[class^="DataTable_body"] tr'
    )
  );

  const contacts: Contact[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const cells = row.querySelectorAll<HTMLTableCellElement>('td');

    if (cells.length < 5) return;

    const nameCell = cells[0];
    const leadCell = cells[4];

    const name = normalizeText(nameCell.innerText) || `Contact ${index + 1}`;
    const lead = normalizeText(leadCell.innerText) || name;

    const emails = Array.from(
      row.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]')
    )
      .map(a =>
        (a.getAttribute("href") || "")
          .replace("mailto:", "")
          .trim()
      )
      .filter(Boolean);

    const phones = Array.from(
      row.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')
    )
      .map(a =>
        (a.getAttribute("href") || "")
          .replace("tel:", "")
          .trim()
      )
      .filter(Boolean);

    const rawId =
      nameCell.querySelector("a[href]")?.getAttribute("href") ||
      `${name}-${lead}`;

    const id = ensureId(rawId);
    if (seen.has(id)) return;
    seen.add(id);

    contacts.push({
      id,
      name,
      emails,
      phones,
      lead,
    });
  });

  return contacts;
}



export function extractSnapshot(): ExtractionSnapshot {
  const view = detectView();
  const timestamp = Date.now();

  if (view === "contacts") {
    return { view, contacts: extractContacts(), timestamp };
  }

  return {
    view,
    contacts: extractContacts(),
    timestamp,
  };
}
