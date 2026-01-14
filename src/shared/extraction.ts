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





export function extractOpportunities(): Opportunity[] {
  const tables = Array.from(
    document.querySelectorAll<HTMLTableElement>(
      'div[class*="OpportunityGroup_tableWrapper"] table'
    )
  );

  const items: Opportunity[] = [];
  const seen = new Set<string>();

  tables.forEach((table) => {
    const rows = Array.from(
      table.querySelectorAll<HTMLTableRowElement>('tbody tr')
    );

    rows.forEach((row) => {
      const cells = row.querySelectorAll<HTMLTableCellElement>('td');
      if (cells.length < 5) return;

      const leadCell = cells[0];
      const valueCell = cells[1];
      const confidenceCell = cells[2];
      const closeDateCell = cells[3];
      const statusCell = cells[4];
      const userCell = cells[5];

      const name = normalizeText(leadCell.innerText);
      const rawValue = normalizeText(valueCell.innerText);
      const confidence = normalizeText(confidenceCell.innerText);
      const closeDate = normalizeText(closeDateCell.innerText);
      const status = normalizeText(statusCell.innerText);
      const user = normalizeText(userCell.innerText);

      const numericValue = Number(rawValue.replace(/[^0-9.-]+/g, "")) || null;

      const rawId =
        leadCell.querySelector("a")?.getAttribute("href") ??
        `${name}-${status}-${closeDate}`;

      const id = ensureId(rawId);
      if (seen.has(id)) return;
      seen.add(id);

      items.push({
        id,
        name,
        value: numericValue,
        confidence,
        closeDate,
        status,
        user,
      });
    });
  });

  return items;
}



export function extractTasks(): Task[] {
  const tasks: Task[] = [];
  const seen = new Set<string>();

  const rows = Array.from(
    document.querySelectorAll<HTMLElement>(
      'div[class*="InboxItemWrapper_container"], div[class*="CollapsedItemLayout_compact_wrapper"]'
    )
  );

  rows.forEach((row, index) => {
    let title =
      normalizeText(
        row.querySelector('span.typography_uiText_0ad')?.textContent ?? ""
      ) ||
      normalizeText(
        row.querySelector('div.CollapsedItemLayout_compact_ellipsis_a1b')?.textContent ?? ""
      );

    if (!title) return;

    const assignee =
      normalizeText(
        row.querySelector('div.ExpandedItemLayout_leadInfoBox_e6b span.typography_uiText_0ad')?.textContent ?? ""
      ) ||
      normalizeText(
        row.querySelector('span.typography_uiText_0ad')?.textContent ?? ""
      ) ||
      "Unknown";

    const timeEl = row.querySelector("time");
    const dueRaw =
      timeEl?.getAttribute("datetime") ??
      normalizeText(timeEl?.textContent ?? "");

    const done =
      row.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked ??
      false;

    const id = ensureId(`task-${title}-${index}`);
    if (seen.has(id)) return;
    seen.add(id);

    tasks.push({
      id,
      description: title,
      assignee,
      dueDate: toDateString(dueRaw),
      done,
    });
  });

  return tasks;
}




export function extractSnapshot(): ExtractionSnapshot {
  const view = detectView();
  const timestamp = Date.now();

  if (view === "contacts") {
    return { view, contacts: extractContacts(), timestamp };
  }
  if (view === "opportunities") {
    return { view, opportunities: extractOpportunities(), timestamp };
  }
  if (view === "tasks") {
    return { view, tasks: extractTasks(), timestamp };
  }

  return {
    view,
    contacts: extractContacts(),
    opportunities: extractOpportunities(),
    tasks: extractTasks(),
    timestamp,
  };
}
