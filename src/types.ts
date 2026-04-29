export type Priority = "baja" | "media" | "alta";
export type TalkStatus = "pendiente" | "quiero asistir" | "asistí" | "descartada";
export type TabId = "today" | "agenda" | "notes" | "checklist" | "ctf" | "export";

export interface Talk {
  id: string;
  title: string;
  speaker: string;
  time: string;
  sortTime: number;
  venue: string;
  block: string;
  language: string;
  tags: string[];
  priority: Priority;
  defaultStatus: TalkStatus;
}

export interface TalkNotes {
  problem: string;
  keywords: string;
  usefulIdea: string;
  question: string;
  contacts: string;
  freeNotes: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface CtfChallenge {
  id: string;
  name: string;
  category: string;
  target: string;
  known: string;
  commands: string;
  findings: string;
  hypothesis: string;
  hints: string;
  flag: string;
  learned: string;
  updatedAt: string;
}

export interface AppData {
  talkStatuses: Record<string, TalkStatus>;
  talkPriorities: Record<string, Priority>;
  talkNotes: Record<string, TalkNotes>;
  checklist: {
    event: ChecklistItem[];
    ctf: ChecklistItem[];
  };
  ctfChallenges: CtfChallenge[];
}
