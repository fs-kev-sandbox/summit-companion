import { initialData } from "./data";
import type { AppData } from "./types";

const STORAGE_KEY = "summit-companion-data-v1";

export function loadAppData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return initialData;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;

    return {
      talkStatuses: { ...initialData.talkStatuses, ...parsed.talkStatuses },
      talkPriorities: { ...initialData.talkPriorities, ...parsed.talkPriorities },
      talkNotes: { ...parsed.talkNotes },
      checklist: {
        event: parsed.checklist?.event ?? initialData.checklist.event,
        ctf: parsed.checklist?.ctf ?? initialData.checklist.ctf,
      },
      ctfChallenges: parsed.ctfChallenges ?? [],
    };
  } catch {
    return initialData;
  }
}

export function saveAppData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
