import { initialData } from "./data";
import type { AppData, ChecklistItem, CtfChallenge, Priority, TalkNotes, TalkStatus } from "./types";

const STORAGE_KEY = "summit-companion-data-v1";
const statuses: TalkStatus[] = ["pendiente", "quiero asistir", "asistí", "descartada"];
const priorities: Priority[] = ["baja", "media", "alta"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function copyInitialData(): AppData {
  return {
    talkStatuses: { ...initialData.talkStatuses },
    talkPriorities: { ...initialData.talkPriorities },
    talkNotes: {},
    checklist: {
      event: initialData.checklist.event.map((item) => ({ ...item })),
      ctf: initialData.checklist.ctf.map((item) => ({ ...item })),
    },
    ctfChallenges: [],
  };
}

function normalizeStatuses(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, TalkStatus] => statuses.includes(entry[1] as TalkStatus)),
  );
}

function normalizePriorities(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, Priority] => priorities.includes(entry[1] as Priority)),
  );
}

function normalizeNotes(value: unknown): Record<string, TalkNotes> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, TalkNotes>>((notesByTalk, [talkId, notes]) => {
    if (!isRecord(notes)) {
      return notesByTalk;
    }

    notesByTalk[talkId] = {
      problem: stringValue(notes.problem),
      keywords: stringValue(notes.keywords),
      usefulIdea: stringValue(notes.usefulIdea),
      question: stringValue(notes.question),
      contacts: stringValue(notes.contacts),
      freeNotes: stringValue(notes.freeNotes),
    };

    return notesByTalk;
  }, {});
}

function normalizeChecklist(items: unknown, fallback: ChecklistItem[]) {
  if (!Array.isArray(items)) {
    return fallback.map((item) => ({ ...item }));
  }

  const normalized = items
    .filter(isRecord)
    .filter((item) => typeof item.id === "string" && typeof item.label === "string")
    .map((item) => ({
      id: item.id as string,
      label: item.label as string,
      checked: typeof item.checked === "boolean" ? item.checked : false,
    }));

  return normalized.length ? normalized : fallback.map((item) => ({ ...item }));
}

function normalizeChallenges(value: unknown): CtfChallenge[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((challenge) => ({
    id: stringValue(challenge.id) || crypto.randomUUID(),
    name: stringValue(challenge.name),
    category: stringValue(challenge.category),
    target: stringValue(challenge.target),
    known: stringValue(challenge.known),
    commands: stringValue(challenge.commands),
    findings: stringValue(challenge.findings),
    hypothesis: stringValue(challenge.hypothesis),
    hints: stringValue(challenge.hints),
    flag: stringValue(challenge.flag),
    learned: stringValue(challenge.learned),
    updatedAt: stringValue(challenge.updatedAt) || new Date().toISOString(),
  }));
}

export function loadAppData(): AppData {
  let raw: string | null = null;

  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return copyInitialData();
  }

  if (!raw) {
    return copyInitialData();
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) {
      return copyInitialData();
    }

    return {
      talkStatuses: { ...initialData.talkStatuses, ...normalizeStatuses(parsed.talkStatuses) },
      talkPriorities: { ...initialData.talkPriorities, ...normalizePriorities(parsed.talkPriorities) },
      talkNotes: normalizeNotes(parsed.talkNotes),
      checklist: {
        event: normalizeChecklist(isRecord(parsed.checklist) ? parsed.checklist.event : undefined, initialData.checklist.event),
        ctf: normalizeChecklist(isRecord(parsed.checklist) ? parsed.checklist.ctf : undefined, initialData.checklist.ctf),
      },
      ctfChallenges: normalizeChallenges(parsed.ctfChallenges),
    };
  } catch {
    return copyInitialData();
  }
}

export function saveAppData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota/private-mode failures; the in-memory session can continue.
  }
}
