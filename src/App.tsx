import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { emptyNotes, talks } from "./data";
import { createJsonExport, createMarkdownExport, createNotesOnlyExport, createTalkNotesExport, downloadText } from "./exporters";
import { loadAppData, parseAppDataBackup, saveAppData } from "./storage";
import type { AppData, CtfChallenge, Priority, TabId, Talk, TalkNotes, TalkStatus } from "./types";

const tabs: { id: TabId; label: string; hint: string }[] = [
  { id: "today", label: "Hoy", hint: "Ruta" },
  { id: "agenda", label: "Agenda", hint: "Notas" },
  { id: "notes", label: "Notas", hint: "Central" },
  { id: "checklist", label: "Checklist", hint: "Prep" },
  { id: "ctf", label: "CTF", hint: "Lab" },
  { id: "export", label: "Exportar", hint: "Backup" },
];

const statuses: TalkStatus[] = ["pendiente", "quiero asistir", "asistí", "descartada"];
const priorities: Priority[] = ["baja", "media", "alta"];
const statusLabels: Record<TalkStatus, string> = {
  pendiente: "Pendiente",
  "quiero asistir": "Voy",
  asistí: "Asisti",
  descartada: "Descarto",
};
const priorityLabels: Record<Priority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};
type EventDayId = "day-1" | "day-2" | "lab";
const eventDays: { id: EventDayId; label: string; venue: string }[] = [
  { id: "day-1", label: "Dia 1", venue: "Sede Centro" },
  { id: "day-2", label: "Dia 2", venue: "Sede Norte" },
  { id: "lab", label: "CTF", venue: "Laboratorio" },
];

function createChallenge(): CtfChallenge {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "",
    target: "",
    known: "",
    commands: "",
    findings: "",
    hypothesis: "",
    hints: "",
    flag: "",
    learned: "",
    updatedAt: new Date().toISOString(),
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [openTalkId, setOpenTalkId] = useState<string | null>(null);
  const stats = useMemo(() => {
    const statusValues = talks.map((talk) => data.talkStatuses[talk.id] ?? talk.defaultStatus);
    const selected = statusValues.filter((status) => status === "quiero asistir").length;
    const attended = statusValues.filter((status) => status === "asistí").length;
    const highPriority = talks.filter((talk) => getTalkPriority(data, talk) === "alta").length;
    const checklistItems = [...data.checklist.event, ...data.checklist.ctf];
    const checkedItems = checklistItems.filter((item) => item.checked).length;
    const notedTalks = talks.filter((talk) => notesHaveContent(data.talkNotes[talk.id])).length;

    return {
      selected,
      attended,
      highPriority,
      notedTalks,
      checklistTotal: checklistItems.length,
      checkedItems,
      ctfCount: data.ctfChallenges.length,
    };
  }, [data]);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  function updateStatus(talkId: string, status: TalkStatus) {
    setData((current) => ({
      ...current,
      talkStatuses: { ...current.talkStatuses, [talkId]: status },
    }));
  }

  function updatePriority(talkId: string, priority: Priority) {
    setData((current) => ({
      ...current,
      talkPriorities: { ...current.talkPriorities, [talkId]: priority },
    }));
  }

  function updateNotes(talkId: string, notes: TalkNotes) {
    setData((current) => ({
      ...current,
      talkNotes: { ...current.talkNotes, [talkId]: notes },
    }));
  }

  function toggleChecklist(group: "event" | "ctf", itemId: string) {
    setData((current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [group]: current.checklist[group].map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item,
        ),
      },
    }));
  }

  function saveChallenge(challenge: CtfChallenge) {
    const updated = { ...challenge, updatedAt: new Date().toISOString() };
    setData((current) => {
      const exists = current.ctfChallenges.some((item) => item.id === updated.id);
      return {
        ...current,
        ctfChallenges: exists
          ? current.ctfChallenges.map((item) => (item.id === updated.id ? updated : item))
          : [updated, ...current.ctfChallenges],
      };
    });
  }

  function deleteChallenge(challengeId: string) {
    setData((current) => ({
      ...current,
      ctfChallenges: current.ctfChallenges.filter((item) => item.id !== challengeId),
    }));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">openSUSE America Summit / Barranquilla 2026</p>
          <h1>Summit Companion</h1>
          <p className="header-summary">
            Cabina local para elegir ruta, capturar notas y no perder el hilo entre sedes.
          </p>
        </div>
        <aside className="briefing-card" aria-label="Resumen de progreso">
          <span>Plan activo</span>
          <strong>{stats.selected} charlas</strong>
          <small>
            {stats.notedTalks} con notas · {stats.checkedItems}/{stats.checklistTotal} checklist · {stats.ctfCount} retos CTF
          </small>
        </aside>
      </header>

      <nav className="tabs" aria-label="Navegación principal">
        <div className="sidebar-brand" aria-hidden="true">
          <span className="brand-cube" />
        </div>
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "tab active" : "tab"}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <span className="tab-label">{tab.label}</span>
            <span className="tab-hint">{tab.hint}</span>
          </button>
        ))}
        <aside className="event-card" aria-label="Resumen del evento">
          <strong>Summit 2026</strong>
          <span>openSUSE America</span>
          <span>Apr 29 - 30, 2026</span>
          <span>Barranquilla, CO</span>
        </aside>
      </nav>

      <main>
        {activeTab === "today" && (
          <RouteView data={data} onStatusChange={updateStatus} onPriorityChange={updatePriority} />
        )}
        {activeTab === "agenda" && (
          <AgendaView
            data={data}
            openTalkId={openTalkId}
            onOpenTalk={setOpenTalkId}
            onStatusChange={updateStatus}
            onPriorityChange={updatePriority}
            onNotesChange={updateNotes}
          />
        )}
        {activeTab === "notes" && (
          <NotesView data={data} onPriorityChange={updatePriority} onNotesChange={updateNotes} />
        )}
        {activeTab === "checklist" && <ChecklistView data={data} onToggle={toggleChecklist} />}
        {activeTab === "ctf" && (
          <CtfView data={data} onSave={saveChallenge} onDelete={deleteChallenge} />
        )}
        {activeTab === "export" && <ExportView data={data} onImport={setData} />}
      </main>

      <footer className="status-bar" aria-label="Estado local">
        <span>Wed, Apr 29, 2026</span>
        <span>America/Bogota</span>
        <span>Data stored locally</span>
      </footer>
    </div>
  );
}

function getTalkStatus(data: AppData, talk: Talk) {
  return data.talkStatuses[talk.id] ?? talk.defaultStatus;
}

function getTalkPriority(data: AppData, talk: Talk) {
  return data.talkPriorities[talk.id] ?? talk.priority;
}

function toStatusClass(status: TalkStatus) {
  return status.replace(" ", "-");
}

function notesHaveContent(notes = emptyNotes) {
  return Object.values(notes).some((value) => value.trim().length > 0);
}

function getTalkDay(talk: Talk): EventDayId {
  if (talk.venue === "Sede Centro") {
    return "day-1";
  }

  if (talk.venue === "Sede Norte") {
    return "day-2";
  }

  return "lab";
}

function getTalkDayLabel(talk: Talk) {
  const day = eventDays.find((item) => item.id === getTalkDay(talk));
  return day ? `${day.label} / ${day.venue}` : talk.venue;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

function TalkCard({
  talk,
  data,
  onStatusChange,
  onPriorityChange,
  children,
}: {
  talk: Talk;
  data: AppData;
  onStatusChange: (talkId: string, status: TalkStatus) => void;
  onPriorityChange: (talkId: string, priority: Priority) => void;
  children?: React.ReactNode;
}) {
  const status = getTalkStatus(data, talk);
  const priority = getTalkPriority(data, talk);

  return (
    <article className={`card talk-card is-${toStatusClass(status)}`}>
      <div className="talk-topline">
        <span className="time">{talk.time}</span>
        <span className={`priority priority-${priority}`}>{priorityLabels[priority]}</span>
      </div>
      <h3>{talk.title}</h3>
      <p className="muted">{talk.speaker}</p>
      <p className="meta">
        {talk.venue} / {talk.block} · {talk.language}
      </p>
      <div className="tags">
        {talk.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="status-row" role="radiogroup" aria-label={`Estado de ${talk.title}`}>
        {statuses.map((item) => (
          <button
            aria-checked={status === item}
            className={status === item ? "status-chip active" : "status-chip"}
            key={item}
            onClick={() => onStatusChange(talk.id, item)}
            role="radio"
            type="button"
          >
            {statusLabels[item]}
          </button>
        ))}
      </div>
      <PriorityControl
        priority={priority}
        onChange={(nextPriority) => onPriorityChange(talk.id, nextPriority)}
      />
      {children}
    </article>
  );
}

function PriorityControl({
  priority,
  onChange,
}: {
  priority: Priority;
  onChange: (priority: Priority) => void;
}) {
  return (
    <div className="priority-control" role="radiogroup" aria-label="Prioridad de la charla">
      <span>Prioridad</span>
      <div>
        {priorities.map((item) => (
          <button
            aria-checked={priority === item}
            className={priority === item ? `priority-choice priority-${item} active` : `priority-choice priority-${item}`}
            key={item}
            onClick={() => onChange(item)}
            role="radio"
            type="button"
          >
            {priorityLabels[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

function RouteView({
  data,
  onStatusChange,
  onPriorityChange,
}: {
  data: AppData;
  onStatusChange: (talkId: string, status: TalkStatus) => void;
  onPriorityChange: (talkId: string, priority: Priority) => void;
}) {
  const [activeDay, setActiveDay] = useState<EventDayId>("day-1");
  const dayTalks = talks.filter((talk) => getTalkDay(talk) === activeDay).sort((a, b) => a.sortTime - b.sortTime);
  const highPriority = dayTalks.filter((talk) => getTalkPriority(data, talk) === "alta");
  const nextTalks = dayTalks
    .filter((talk) => getTalkStatus(data, talk) !== "descartada")
    .slice(0, 6);
  const selectedTalks = dayTalks
    .filter((talk) => getTalkStatus(data, talk) === "quiero asistir");
  const activeDayMeta = eventDays.find((day) => day.id === activeDay) ?? eventDays[0];
  const checklistItems = [...data.checklist.event, ...data.checklist.ctf];
  const checkedItems = checklistItems.filter((item) => item.checked).length;

  return (
    <section className="stack">
      <div className="day-switch" role="tablist" aria-label="Dias del evento">
        {eventDays.map((day) => (
          <button
            aria-selected={activeDay === day.id}
            className={activeDay === day.id ? "day-tab active" : "day-tab"}
            key={day.id}
            onClick={() => setActiveDay(day.id)}
            role="tab"
            type="button"
          >
            <span>{day.label}</span>
            <strong>{day.venue}</strong>
          </button>
        ))}
      </div>
      <div className="command-grid">
        <article className="route-panel">
          <p className="eyebrow">Ruta sugerida / {activeDayMeta.venue}</p>
          <h2>{selectedTalks.length ? `Tu ${activeDayMeta.label} ya tiene intención` : `Marca prioridades para ${activeDayMeta.label}`}</h2>
          <div className="route-list">
            {(selectedTalks.length ? selectedTalks : highPriority.slice(0, 5)).map((talk) => (
              <div className="route-stop" key={talk.id}>
                <span>{talk.time}</span>
                <strong>{talk.title}</strong>
                <small>{talk.venue} / {talk.block}</small>
              </div>
            ))}
          </div>
        </article>
        <div className="signal-grid">
          <MetricCard label="Actividades" value={dayTalks.length.toString()} detail={activeDayMeta.label} />
          <MetricCard label="Alta prioridad" value={highPriority.length.toString()} detail={activeDayMeta.venue} />
          <MetricCard label="Checklist" value={`${checkedItems}/${checklistItems.length}`} detail="preparacion" />
        </div>
      </div>

      <SectionHeader title={`Prioridad alta / ${activeDayMeta.label}`} text="Decisiones dentro del dia seleccionado." />
      <div className="grid">
        {highPriority.map((talk) => (
          <TalkCard
            key={talk.id}
            talk={talk}
            data={data}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>

      <SectionHeader title={`Linea de movimiento / ${activeDayMeta.venue}`} text="Orden horario sin mezclar sedes de dias distintos." />
      <div className="grid">
        {nextTalks.map((talk) => (
          <TalkCard
            key={talk.id}
            talk={talk}
            data={data}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function AgendaView({
  data,
  openTalkId,
  onOpenTalk,
  onStatusChange,
  onPriorityChange,
  onNotesChange,
}: {
  data: AppData;
  openTalkId: string | null;
  onOpenTalk: (talkId: string | null) => void;
  onStatusChange: (talkId: string, status: TalkStatus) => void;
  onPriorityChange: (talkId: string, priority: Priority) => void;
  onNotesChange: (talkId: string, notes: TalkNotes) => void;
}) {
  const groups = useMemo(() => {
    const order: { title: string; key: string }[] = [
      { title: "Dia 1 / Sede Centro / Mañana", key: "Sede Centro / Mañana" },
      { title: "Dia 1 / Sede Centro / Tarde", key: "Sede Centro / Tarde" },
      { title: "Dia 2 / Sede Norte / Mañana", key: "Sede Norte / Mañana" },
      { title: "Dia 2 / Sede Norte / Tarde", key: "Sede Norte / Tarde" },
      { title: "CTF / Laboratorio transversal", key: "CTF / Laboratorio" },
    ];

    return order.map((group) => ({
      name: group.title,
      talks: talks.filter((talk) => `${talk.venue} / ${talk.block}` === group.key).sort((a, b) => a.sortTime - b.sortTime),
    }));
  }, []);

  return (
    <section className="stack">
      {groups.map((group) => (
        <div className="group" key={group.name}>
          <SectionHeader title={group.name} text={`${group.talks.length} actividad(es)`} />
          <div className="grid">
            {group.talks.map((talk) => {
              const notes = data.talkNotes[talk.id] ?? emptyNotes;
              const isOpen = openTalkId === talk.id;

              return (
                <TalkCard
                  key={talk.id}
                  talk={talk}
                  data={data}
                  onStatusChange={onStatusChange}
                  onPriorityChange={onPriorityChange}
                >
                  <button className="secondary-button" type="button" onClick={() => onOpenTalk(isOpen ? null : talk.id)}>
                    {isOpen ? "Cerrar notas" : "Abrir notas"}
                  </button>
                  {isOpen && <NotesEditor notes={notes} onChange={(nextNotes) => onNotesChange(talk.id, nextNotes)} />}
                </TalkCard>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function NotesEditor({ notes, onChange }: { notes: TalkNotes; onChange: (notes: TalkNotes) => void }) {
  return (
    <div className="notes-panel">
      <TextInput label="Problema que intenta resolver" value={notes.problem} onChange={(value) => onChange({ ...notes, problem: value })} />
      <TextInput label="Palabras clave" value={notes.keywords} onChange={(value) => onChange({ ...notes, keywords: value })} />
      <TextInput label="Idea útil para mi ruta" value={notes.usefulIdea} onChange={(value) => onChange({ ...notes, usefulIdea: value })} />
      <TextInput label="Pregunta que me surgió" value={notes.question} onChange={(value) => onChange({ ...notes, question: value })} />
      <TextInput label="Contactos o personas mencionadas" value={notes.contacts} onChange={(value) => onChange({ ...notes, contacts: value })} />
      <TextArea label="Notas libres" value={notes.freeNotes} onChange={(value) => onChange({ ...notes, freeNotes: value })} />
    </div>
  );
}

function NotesView({
  data,
  onPriorityChange,
  onNotesChange,
}: {
  data: AppData;
  onPriorityChange: (talkId: string, priority: Priority) => void;
  onNotesChange: (talkId: string, notes: TalkNotes) => void;
}) {
  const [selectedTalkId, setSelectedTalkId] = useState(() => {
    const firstWithNotes = talks.find((talk) => notesHaveContent(data.talkNotes[talk.id]));
    return firstWithNotes?.id ?? talks[0]?.id;
  });
  const selectedTalk = talks.find((talk) => talk.id === selectedTalkId) ?? talks[0];
  const notes = data.talkNotes[selectedTalk.id] ?? emptyNotes;
  const talksWithNotes = talks.filter((talk) => notesHaveContent(data.talkNotes[talk.id]));

  return (
    <section className="notes-workbench">
      <aside className="notes-index card">
        <div className="notes-index-head">
          <SectionHeader title="Notas centralizadas" text={`${talksWithNotes.length}/${talks.length} charlas con notas`} />
          <button
            type="button"
            onClick={() => downloadText("summit-notas-charlas.md", createNotesOnlyExport(data), "text/markdown;charset=utf-8")}
          >
            Exportar notas
          </button>
        </div>
        <div className="notes-list" role="listbox" aria-label="Charlas con notas">
          {talks.map((talk) => {
            const hasNotes = notesHaveContent(data.talkNotes[talk.id]);
            const isSelected = selectedTalk.id === talk.id;
            const priority = getTalkPriority(data, talk);

            return (
              <button
                aria-selected={isSelected}
                className={isSelected ? "note-row active" : "note-row"}
                key={talk.id}
                onClick={() => setSelectedTalkId(talk.id)}
                role="option"
                type="button"
              >
                <span>{talk.time}</span>
                <strong>{talk.title}</strong>
                <small>
                  {getTalkDayLabel(talk)} · {priorityLabels[priority]} · {hasNotes ? "Con notas" : "Sin notas"}
                </small>
              </button>
            );
          })}
        </div>
      </aside>

      <article className="note-editor-card card">
        <div className="note-editor-head">
          <div>
            <p className="eyebrow">{getTalkDayLabel(selectedTalk)} / {selectedTalk.block}</p>
            <h2>{selectedTalk.title}</h2>
            <p className="meta">
              {selectedTalk.time} · {selectedTalk.speaker} · {selectedTalk.language}
            </p>
            <PriorityControl
              priority={getTalkPriority(data, selectedTalk)}
              onChange={(nextPriority) => onPriorityChange(selectedTalk.id, nextPriority)}
            />
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              downloadText(
                `notas-${slugify(selectedTalk.title)}.md`,
                createTalkNotesExport(selectedTalk, data),
                "text/markdown;charset=utf-8",
              )
            }
          >
            Exportar esta charla
          </button>
        </div>
        <NotesEditor notes={notes} onChange={(nextNotes) => onNotesChange(selectedTalk.id, nextNotes)} />
      </article>
    </section>
  );
}

function ChecklistView({
  data,
  onToggle,
}: {
  data: AppData;
  onToggle: (group: "event" | "ctf", itemId: string) => void;
}) {
  return (
    <section className="two-column">
      <ChecklistGroup title="General del evento" items={data.checklist.event} onToggle={(id) => onToggle("event", id)} />
      <ChecklistGroup title="CTF" items={data.checklist.ctf} onToggle={(id) => onToggle("ctf", id)} />
    </section>
  );
}

function ChecklistGroup({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: AppData["checklist"]["event"];
  onToggle: (itemId: string) => void;
}) {
  const completed = items.filter((item) => item.checked).length;

  return (
    <section className="card">
      <SectionHeader title={title} text={`${completed}/${items.length} completados`} />
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${(completed / items.length) * 100}%` }} />
      </div>
      <div className="checklist">
        {items.map((item) => (
          <label className="check-item" key={item.id}>
            <input type="checkbox" checked={item.checked} onChange={() => onToggle(item.id)} />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function CtfView({
  data,
  onSave,
  onDelete,
}: {
  data: AppData;
  onSave: (challenge: CtfChallenge) => void;
  onDelete: (challengeId: string) => void;
}) {
  const [draft, setDraft] = useState<CtfChallenge>(() => createChallenge());
  const isEditing = data.ctfChallenges.some((challenge) => challenge.id === draft.id);
  const solvedCount = data.ctfChallenges.filter((challenge) => challenge.flag.trim()).length;

  function startNewChallenge() {
    setDraft(createChallenge());
  }

  function editChallenge(challenge: CtfChallenge) {
    setDraft(challenge);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
    setDraft({ ...draft, updatedAt: new Date().toISOString() });
  }

  function removeChallenge(challengeId: string) {
    onDelete(challengeId);
    if (draft.id === challengeId) {
      startNewChallenge();
    }
  }

  return (
    <section className="ctf-workbench">
      <div className="lab-brief">
        <div>
          <p className="eyebrow">CTF notebook</p>
          <h2>{isEditing ? "Editando reto guardado" : "Nuevo reto en progreso"}</h2>
        </div>
        <p>
          Lista y editor trabajan juntos: selecciona un reto guardado para continuar, o crea uno nuevo sin perder el
          contexto de enumeracion.
        </p>
      </div>

      <aside className="ctf-list card">
        <div className="ctf-list-head">
          <SectionHeader title="Retos" text={`${solvedCount}/${data.ctfChallenges.length} con flag`} />
          <button type="button" onClick={startNewChallenge}>Nuevo reto</button>
        </div>
        <div className="ctf-stats">
          <MetricCard label="Guardados" value={data.ctfChallenges.length.toString()} detail="retos" />
          <MetricCard label="Flags" value={solvedCount.toString()} detail="capturadas" />
        </div>
        <div className="ctf-challenge-list" role="listbox" aria-label="Retos CTF guardados">
          {data.ctfChallenges.length === 0 && (
            <p className="empty-state">No hay retos guardados todavia.</p>
          )}
          {data.ctfChallenges.map((challenge) => {
            const isActive = challenge.id === draft.id;

            return (
              <button
                aria-selected={isActive}
                className={isActive ? "ctf-row active" : "ctf-row"}
                key={challenge.id}
                onClick={() => editChallenge(challenge)}
                role="option"
                type="button"
              >
                <strong>{challenge.name || "Reto sin nombre"}</strong>
                <span>{challenge.category || "Sin categoria"} · {challenge.target || "Sin objetivo"}</span>
                <small>{challenge.flag ? "Flag registrada" : "En progreso"}</small>
              </button>
            );
          })}
        </div>
      </aside>

      <form className="card ctf-editor" onSubmit={submit}>
        <div className="ctf-editor-head">
          <SectionHeader
            title={isEditing ? "Editor de reto" : "Captura de reto"}
            text={isEditing ? "Los cambios actualizan el reto seleccionado." : "Guarda para agregarlo a la lista."}
          />
          <div className="ctf-mode">
            <span>{isEditing ? "Editing" : "Draft"}</span>
          </div>
        </div>

        <div className="ctf-form-grid">
          <TextInput label="Nombre del reto" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} required />
          <TextInput label="Categoría" value={draft.category} onChange={(value) => setDraft({ ...draft, category: value })} />
          <TextInput label="IP o URL" value={draft.target} onChange={(value) => setDraft({ ...draft, target: value })} />
          <TextInput label="Flag" value={draft.flag} onChange={(value) => setDraft({ ...draft, flag: value })} />
        </div>

        <div className="ctf-notes-grid">
          <TextArea label="Qué sé" value={draft.known} onChange={(value) => setDraft({ ...draft, known: value })} />
          <TextArea label="Comandos usados" value={draft.commands} onChange={(value) => setDraft({ ...draft, commands: value })} />
          <TextArea label="Hallazgos" value={draft.findings} onChange={(value) => setDraft({ ...draft, findings: value })} />
          <TextArea label="Hipótesis" value={draft.hypothesis} onChange={(value) => setDraft({ ...draft, hypothesis: value })} />
          <TextArea label="Pistas recibidas" value={draft.hints} onChange={(value) => setDraft({ ...draft, hints: value })} />
          <TextArea label="Qué aprendí" value={draft.learned} onChange={(value) => setDraft({ ...draft, learned: value })} />
        </div>

        <div className="ctf-actions">
          <button type="submit">{isEditing ? "Guardar cambios" : "Guardar reto"}</button>
          <button className="secondary-button" type="button" onClick={startNewChallenge}>
            Nuevo limpio
          </button>
          {isEditing && (
            <button className="danger-button" type="button" onClick={() => removeChallenge(draft.id)}>
              Eliminar seleccionado
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function ExportView({ data, onImport }: { data: AppData; onImport: (data: AppData) => void }) {
  const [importStatus, setImportStatus] = useState("");

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const importedData = parseAppDataBackup(parsed);

      if (!importedData) {
        setImportStatus("No se importó nada: el archivo no parece un backup JSON de Summit Companion.");
        return;
      }

      onImport(importedData);
      setImportStatus("Backup importado. Agenda, notas, checklist y CTF fueron reemplazados.");
    } catch {
      setImportStatus("No se importó nada: el JSON está corrupto o no se pudo leer.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="card export-panel">
      <SectionHeader title="Exportar / importar" text="Descarga o restaura una copia local de agenda, notas, checklist y CTF." />
      <div className="actions">
        <button
          type="button"
          onClick={() => downloadText("summit-companion.md", createMarkdownExport(data), "text/markdown;charset=utf-8")}
        >
          Exportar Markdown
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => downloadText("summit-notas-charlas.md", createNotesOnlyExport(data), "text/markdown;charset=utf-8")}
        >
          Solo notas de charlas
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => downloadText("summit-companion.json", createJsonExport(data), "application/json;charset=utf-8")}
        >
          Exportar JSON
        </button>
      </div>
      <div className="import-panel">
        <div>
          <strong>Importar backup JSON</strong>
          <p>Restaura un archivo exportado desde esta app. La importación reemplaza los datos actuales.</p>
        </div>
        <label className="file-import-label" htmlFor="backup-import">
          Seleccionar JSON
        </label>
        <input
          accept="application/json,.json"
          className="file-input"
          id="backup-import"
          type="file"
          onChange={importBackup}
        />
        {importStatus && <p className="import-status" role="status">{importStatus}</p>}
      </div>
    </section>
  );
}

function SectionHeader({ title, text }: { title: string; text?: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="field">
      {label}
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

export default App;
