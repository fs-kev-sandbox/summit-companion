import { emptyNotes, talks } from "./data";
import type { AppData, ChecklistItem, CtfChallenge, Priority, Talk } from "./types";

function line(value: string) {
  return value.trim() || "_Sin registrar_";
}

function checklistMarkdown(title: string, items: ChecklistItem[]) {
  return [`## ${title}`, "", ...items.map((item) => `- [${item.checked ? "x" : " "}] ${item.label}`), ""].join("\n");
}

function talkPriority(talk: Talk, data: AppData): Priority {
  return data.talkPriorities[talk.id] ?? talk.priority;
}

function talkDayLabel(talk: Talk) {
  if (talk.venue === "Sede Centro") {
    return "Dia 1 / Sede Centro";
  }

  if (talk.venue === "Sede Norte") {
    return "Dia 2 / Sede Norte";
  }

  return "CTF / Laboratorio transversal";
}

function talkMarkdown(talk: Talk, data: AppData) {
  const notes = data.talkNotes[talk.id] ?? emptyNotes;
  const status = data.talkStatuses[talk.id] ?? talk.defaultStatus;

  return [
    `### ${talk.time} - ${talk.title}`,
    "",
    `- Ponente: ${talk.speaker}`,
    `- Dia: ${talkDayLabel(talk)}`,
    `- Bloque: ${talk.block}`,
    `- Idioma probable: ${talk.language}`,
    `- Prioridad: ${talkPriority(talk, data)}`,
    `- Estado: ${status}`,
    `- Tags: ${talk.tags.join(", ")}`,
    "",
    "#### Notas",
    "",
    `- Problema que intenta resolver: ${line(notes.problem)}`,
    `- Palabras clave: ${line(notes.keywords)}`,
    `- Idea útil para mi ruta: ${line(notes.usefulIdea)}`,
    `- Pregunta que me surgió: ${line(notes.question)}`,
    `- Contactos o personas mencionadas: ${line(notes.contacts)}`,
    "",
    "Notas libres:",
    "",
    line(notes.freeNotes),
    "",
  ].join("\n");
}

function notesHaveContent(notes = emptyNotes) {
  return Object.values(notes).some((value) => value.trim().length > 0);
}

function ctfMarkdown(challenge: CtfChallenge) {
  return [
    `### ${challenge.name || "Reto sin nombre"}`,
    "",
    `- Categoría: ${line(challenge.category)}`,
    `- IP o URL: ${line(challenge.target)}`,
    `- Actualizado: ${challenge.updatedAt}`,
    "",
    `**Qué sé:** ${line(challenge.known)}`,
    "",
    "**Comandos usados:**",
    "",
    "```bash",
    challenge.commands.trim(),
    "```",
    "",
    `**Hallazgos:** ${line(challenge.findings)}`,
    "",
    `**Hipótesis:** ${line(challenge.hypothesis)}`,
    "",
    `**Pistas recibidas:** ${line(challenge.hints)}`,
    "",
    `**Flag:** ${line(challenge.flag)}`,
    "",
    `**Qué aprendí:** ${line(challenge.learned)}`,
    "",
  ].join("\n");
}

export function createMarkdownExport(data: AppData) {
  return [
    "# Summit Companion - openSUSE América Summit Barranquilla 2026",
    "",
    `Exportado: ${new Date().toLocaleString("es-CO")}`,
    "",
    "# Agenda y notas",
    "",
    ...talks.map((talk) => talkMarkdown(talk, data)),
    "# Checklist",
    "",
    checklistMarkdown("General del evento", data.checklist.event),
    checklistMarkdown("CTF", data.checklist.ctf),
    "# Retos CTF",
    "",
    data.ctfChallenges.length
      ? data.ctfChallenges.map(ctfMarkdown).join("\n")
      : "_No hay retos CTF registrados._\n",
  ].join("\n");
}

export function createTalkNotesExport(talk: Talk, data: AppData) {
  return [`# Notas - ${talk.title}`, "", talkMarkdown(talk, data)].join("\n");
}

export function createNotesOnlyExport(data: AppData) {
  const talksWithNotes = talks.filter((talk) => notesHaveContent(data.talkNotes[talk.id]));

  return [
    "# Notas de charlas - openSUSE America Summit Barranquilla 2026",
    "",
    `Exportado: ${new Date().toLocaleString("es-CO")}`,
    "",
    talksWithNotes.length
      ? talksWithNotes.map((talk) => talkMarkdown(talk, data)).join("\n")
      : "_Todavia no hay notas registradas._\n",
  ].join("\n");
}

export function createJsonExport(data: AppData) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      talks,
      data,
    },
    null,
    2,
  );
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
